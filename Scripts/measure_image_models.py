#!/usr/bin/env python3
"""
Mide los modelos ya entrenados de clasificación de imágenes de un paquete .n4l (public/n4l/<id>.n4l/) con las imágenes
de prueba de su conjunto: las filas del sprite que siguen a las de entrenamiento (`train`), que el modelo no vio al
entrenar. Con --write guarda en el manifiesto sus métricas (`metrics`: test_accuracy y test_images).

El modelo se ejecuta aquí mismo con numpy, capa a capa (Conv2D, MaxPooling2D, Dropout, Flatten y Dense: las que sabe
explicar la aplicación con LRP), con la misma entrada que le da la aplicación: cada píxel del sprite entre 0 y 1 (en
gris, un canal; en color, RGB).

Uso:  python3 Scripts/measure_image_models.py --package mnist [--write]
Requiere numpy y Pillow.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

N4L_DIR = Path(__file__).resolve().parent.parent / 'public' / 'n4l'
BATCH = 500

ACTIVATIONS = {
    'linear' : lambda x: x,
    'relu'   : lambda x: np.maximum(x, 0),
    'sigmoid': lambda x: 1 / (1 + np.exp(-x)),
    'tanh'   : np.tanh,
    'softmax': lambda x: (lambda e: e / e.sum(axis=-1, keepdims=True))(np.exp(x - x.max(axis=-1, keepdims=True))),
}


def load_layers_model(model_json: Path):
    """Las capas del model.json de TF.js y sus pesos (float32), en el orden de weightsManifest"""
    spec = json.loads(model_json.read_text())
    topology = spec['modelTopology']
    config = topology.get('model_config', topology)['config']
    layers = config['layers'] if isinstance(config, dict) else config
    data = b''.join((model_json.parent / path).read_bytes() for group in spec['weightsManifest'] for path in group['paths'])
    weights, offset = [], 0
    for weight in (weight for group in spec['weightsManifest'] for weight in group['weights']):
        if weight['dtype'] != 'float32' or 'quantization' in weight:
            raise SystemExit(f'{weight["name"]}: solo se saben leer pesos float32 sin cuantizar')
        size = int(np.prod(weight['shape']))
        weights.append(np.frombuffer(data, dtype='<f4', count=size, offset=offset).reshape(weight['shape']))
        offset += 4 * size
    return layers, weights


def conv2d(x: np.ndarray, kernel: np.ndarray, padding: str) -> np.ndarray:
    kh, kw, cin, cout = kernel.shape
    if padding == 'same':
        x = np.pad(x, ((0, 0), (kh // 2, (kh - 1) // 2), (kw // 2, (kw - 1) // 2), (0, 0)))
    # (n, h', w', c, kh, kw) → (n, h', w', kh, kw, c): el orden del kernel
    windows = np.lib.stride_tricks.sliding_window_view(x, (kh, kw), axis=(1, 2)).transpose(0, 1, 2, 4, 5, 3)
    n, h, w = windows.shape[:3]
    return (windows.reshape(n * h * w, kh * kw * cin) @ kernel.reshape(kh * kw * cin, cout)).reshape(n, h, w, cout)


def max_pooling2d(x: np.ndarray, pool: int) -> np.ndarray:
    n, h, w, c = x.shape
    h, w = h // pool, w // pool
    return x[:, :h * pool, :w * pool].reshape(n, h, pool, w, pool, c).max(axis=(2, 4))


def predict(layers, weights, x: np.ndarray) -> np.ndarray:
    remaining = list(weights)
    for layer in layers:
        name, config = layer['class_name'], layer['config']
        if name == 'Conv2D':
            if tuple(config['strides']) != (1, 1):
                raise SystemExit('Conv2D: solo con strides 1')
            kernel = remaining.pop(0)
            x = conv2d(x, kernel, config['padding'])
            if config.get('use_bias', True):
                x = x + remaining.pop(0)
            x = ACTIVATIONS[config['activation']](x)
        elif name == 'MaxPooling2D':
            if tuple(config['pool_size']) != tuple(config['strides']) or config['pool_size'][0] != config['pool_size'][1]:
                raise SystemExit('MaxPooling2D: solo cuadrado y con strides igual al tamaño')
            x = max_pooling2d(x, config['pool_size'][0])
        elif name == 'Dense':
            x = x @ remaining.pop(0)
            if config.get('use_bias', True):
                x = x + remaining.pop(0)
            x = ACTIVATIONS[config['activation']](x)
        elif name == 'Flatten':
            x = x.reshape(x.shape[0], -1)
        elif name in ('Dropout', 'InputLayer'):
            pass
        else:
            raise SystemExit(f'capa {name}: no se sabe ejecutar')
    if remaining:
        raise SystemExit(f'sobran {len(remaining)} pesos: el model.json no es el esperado')
    return x


def test_split(package: Path, dataset: dict):
    """Las imágenes de prueba del sprite (entre 0 y 1, como las recibe el modelo) y su clase"""
    image = dataset['image']
    sprite = np.array(Image.open(package / dataset['file']))
    # En gris basta con un canal; en color, los tres primeros (sin el alfa, si lo tiene)
    if sprite.ndim == 3:
        sprite = sprite[..., 0] if image['channels'] == 1 else sprite[..., :image['channels']]
    labels = np.frombuffer((package / dataset['labels']).read_bytes(), dtype=np.uint8)
    labels = labels.reshape(dataset['rows'], -1).argmax(axis=1)
    rows = sprite[dataset['train']:dataset['rows']].reshape(-1, image['height'], image['width'], image['channels'])
    return rows.astype(np.float32) / 255, labels[dataset['train']:]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--package', required=True, help='id del paquete (public/n4l/<id>.n4l)')
    parser.add_argument('--write', action='store_true', help='guarda las métricas en el manifiesto')
    args = parser.parse_args()

    package = N4L_DIR / f'{args.package}.n4l'
    manifest_file = package / 'manifest.json'
    manifest = json.loads(manifest_file.read_text())
    datasets = {dataset['id']: dataset for dataset in manifest['datasets']}
    section = next(section for section in manifest['tasks'] if section['task'] == 'image-classification')
    for model in section['models']:
        dataset = datasets[model['dataset']]
        if model['format'] != 'tfjs-layers' or dataset.get('kind') != 'image-sprite':
            print(f'{model["id"]}: no es un modelo de TF.js con un sprite del paquete, no se mide')
            continue
        layers, weights = load_layers_model(package / model['path'])
        images, labels = test_split(package, dataset)
        predictions = np.concatenate([predict(layers, weights, images[i:i + BATCH]).argmax(axis=1) for i in range(0, len(images), BATCH)])
        accuracy = float((predictions == labels).mean())
        print(f'{args.package}/{model["id"]}: {accuracy:.4f} de aciertos con {len(labels)} imágenes de prueba')
        model['metrics'] = {**model.get('metrics', {}), 'test_accuracy': round(accuracy, 4), 'test_images': int(len(labels))}
    if args.write:
        manifest_file.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
        print(f'métricas guardadas en {manifest_file}')


if __name__ == '__main__':
    main()
