#!/usr/bin/env python3
"""
Prepara el paquete .n4l de CIFAR-10 (public/n4l/cifar10.n4l/) con sus datos, sus imágenes de ejemplo y su manifiesto
(sus textos, en locales/, se escriben a mano; el modelo lo entrena Scripts/train_cifar10_model.py):

  - data/cifar10_images.png : sprite en color, una imagen de 32×32 por fila (1024 px de ancho, RGB). Primero las de
                              entrenamiento y después las de prueba.
  - data/cifar10_labels_uint8: sus clases en one-hot, 10 bytes por imagen, en el mismo orden.
  - examples/<clase>.png    : una foto de prueba de cada clase, ampliada ×4 sin suavizar (128×128).

Se toma un subconjunto equilibrado, como en KMNIST: las primeras --train-per-class imágenes de cada clase de las de
entrenamiento oficiales y las primeras --test-per-class de las de prueba (con los valores por defecto, unos 16 MB). El
modelo ya entrenado no vio ninguna de las de prueba.

Las fotos de ejemplo son de prueba, pero no del sprite: de cada clase, la primera que sigue a las del sprite y que el
modelo del paquete acierta (los ejemplos enseñan lo que reconoce; sus fallos se ven con las imágenes de prueba). Por eso
este script va después de entrenar el modelo, y después de él, el que mide el modelo con las imágenes de prueba del
sprite y guarda sus métricas en el manifiesto:

  python3 Scripts/train_cifar10_model.py
  python3 Scripts/build_cifar10_package.py
  python3 Scripts/measure_image_models.py --package cifar10 --write

Uso:  python3 Scripts/build_cifar10_package.py [--train-per-class 500] [--test-per-class 200] [--data-dir …]
Requiere numpy y Pillow.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

from cifar10_data import CLASS_LABELS, DEFAULT_DATA_DIR, TEST_FILES, TRAIN_FILES, cifar_dir, load_split
import measure_image_models

PACKAGE = Path(__file__).resolve().parent.parent / 'public' / 'n4l' / 'cifar10.n4l'
MODEL = 'models/cnn/model.json'
EXAMPLE_SCALE = 4
IMAGE = {'width': 32, 'height': 32, 'channels': 3}
# La red con la que se empieza a entrenar en la aplicación: la del tutorial de CIFAR-10 de TensorFlow, pequeña para que
# entrene en el navegador. La primera capa recibe las fotos: no se puede quitar
TRAINING_LAYERS = [
    {'class': 'conv2d', 'filters': 32, 'kernelSize': 3, 'activation': 'relu', 'locked': True},
    {'class': 'maxPooling2d', 'poolSize': 2, 'strides': 2},
    {'class': 'conv2d', 'filters': 64, 'kernelSize': 3, 'activation': 'relu'},
    {'class': 'maxPooling2d', 'poolSize': 2, 'strides': 2},
    {'class': 'conv2d', 'filters': 64, 'kernelSize': 3, 'activation': 'relu'},
    {'class': 'flatten'},
    {'class': 'dense', 'units': 64, 'activation': 'relu'},
    {'class': 'dense', 'units': len(CLASS_LABELS), 'activation': 'softmax'},
]
CITATION = '''@techreport{krizhevsky2009learning,
  title       = {Learning Multiple Layers of Features from Tiny Images},
  author      = {Krizhevsky, Alex},
  institution = {University of Toronto},
  year        = {2009}
}'''


def balanced(labels: np.ndarray, per_class: int) -> np.ndarray:
    """Las primeras `per_class` de cada clase, en el orden original"""
    return np.sort(np.concatenate([np.flatnonzero(labels == c)[:per_class] for c in range(len(CLASS_LABELS))]))


def hwc(images: np.ndarray) -> np.ndarray:
    """(n, 3, 32, 32) → (n, 32, 32, 3): alto, ancho y canal, como el sprite y la red"""
    return images.transpose(0, 2, 3, 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--train-per-class', type=int, default=500)
    parser.add_argument('--test-per-class', type=int, default=200)
    parser.add_argument('--data-dir', type=Path, default=DEFAULT_DATA_DIR)
    args = parser.parse_args()

    batches = cifar_dir(args.data_dir)
    train_images, train_labels = load_split(batches, TRAIN_FILES)
    test_images, test_labels = load_split(batches, TEST_FILES)
    train_rows = balanced(train_labels, args.train_per_class)
    test_rows = balanced(test_labels, args.test_per_class)

    # El sprite y sus clases
    images = np.concatenate([hwc(train_images[train_rows]), hwc(test_images[test_rows])])
    labels = np.concatenate([train_labels[train_rows], test_labels[test_rows]])
    (PACKAGE / 'data').mkdir(parents=True, exist_ok=True)
    Image.fromarray(images.reshape(len(images), 32 * 32, 3), 'RGB').save(PACKAGE / 'data' / 'cifar10_images.png', optimize=True)
    np.eye(len(CLASS_LABELS), dtype=np.uint8)[labels].tofile(PACKAGE / 'data' / 'cifar10_labels_uint8')
    print(f'Sprite: {len(train_rows)} imágenes de entrenamiento y {len(test_rows)} de prueba, '
          f'{(PACKAGE / "data" / "cifar10_images.png").stat().st_size / 1e6:.1f} MB')

    # Las fotos de ejemplo: de las de prueba que no están en el sprite, la primera de cada clase que el modelo acierta
    layers, weights = measure_image_models.load_layers_model(PACKAGE / MODEL)
    outside = np.setdiff1d(np.arange(len(test_labels)), test_rows)
    candidates = outside[:2000]
    predictions = measure_image_models.predict(layers, weights, hwc(test_images[candidates]).astype(np.float32) / 255).argmax(axis=1)
    (PACKAGE / 'examples').mkdir(exist_ok=True)
    examples = []
    for label, name in enumerate(CLASS_LABELS):
        row = next(int(row) for row, prediction in zip(candidates, predictions) if test_labels[row] == label and prediction == label)
        big = Image.fromarray(hwc(test_images[[row]])[0]).resize((32 * EXAMPLE_SCALE, 32 * EXAMPLE_SCALE), Image.Resampling.NEAREST)
        big.save(PACKAGE / 'examples' / f'{name}.png', optimize=True)
        examples.append({'file': f'examples/{name}.png', 'expected': name})

    manifest = {
        '$schema'      : '../n4l.schema.json',
        'format'       : 'n4l',
        'formatVersion': 1,
        'id'           : 'cifar10',
        'version'      : '1.0.0',
        'locales'      : ['es', 'en', 'ja'],
        'source'       : {'url': 'https://www.cs.toronto.edu/~kriz/cifar.html', 'citation': CITATION},
        'datasets'     : [{
            'id'    : 'cifar10',
            'kind'  : 'image-sprite',
            'file'  : 'data/cifar10_images.png',
            'labels': 'data/cifar10_labels_uint8',
            'rows'  : len(images),
            'train' : len(train_rows),
            'image' : IMAGE,
        }],
        'tasks'        : [{
            'task'         : 'image-classification',
            'key'          : 'IMAGE-CIFAR10',
            'runtime'      : 'image-classification',
            'datasets'     : ['cifar10'],
            'order'        : 3,
            'preprocessing': [],
            'classes'      : [{'id': name} for name in CLASS_LABELS],
            'models'       : [{'id': 'cnn', 'format': 'tfjs-layers', 'path': MODEL, 'dataset': 'cifar10'}],
            'prediction'   : {'images': examples},
            # Con 5.000 fotos, 0,001 y 20 épocas llegan a un 43 % de aciertos; con los valores de la aplicación (0,01 y 5),
            # a un 16 %
            'training'     : {'layers': TRAINING_LAYERS, 'learningRate': 0.001, 'epochs': 20},
        }],
    }
    (PACKAGE / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print(f'Manifiesto en {PACKAGE / "manifest.json"}')


if __name__ == '__main__':
    main()
