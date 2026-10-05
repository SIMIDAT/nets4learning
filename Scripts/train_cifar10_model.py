#!/usr/bin/env python3
"""
Entrena el modelo ya entrenado del paquete de CIFAR-10 (/playground/image-classification/model/IMAGE-CIFAR10) y lo
guarda en formato TensorFlow.js (model.json + weights.bin) en public/n4l/cifar10.n4l/models/cnn/.

- Datos: las 50.000 imágenes de entrenamiento oficiales de CIFAR-10 (se descargan la primera vez en --data-dir). Las
  10.000 de prueba solo se usan al final, para medirlo: no deciden nada del entrenamiento.
- Red: como la de KMNIST (tres bloques de dos Conv2D y MaxPooling2D, y dos Dense), porque la explicación con LRP de la
  aplicación solo sabe propagar Conv2D, MaxPooling2D, Dropout, Flatten y Dense. Se entrena con BatchNormalization detrás
  de cada Conv2D (aprende más y antes) y, al guardarla, cada una se funde en los pesos de su Conv2D: la red que se guarda
  da lo mismo sin ellas.
- Aumento de datos: recortes desplazados (con 4 píxeles de margen) y volteos horizontales.
- Entrada: cada píxel entre 0 y 1, en RGB, como se la da la aplicación.

Después, para que el manifiesto del paquete tenga sus métricas con las imágenes de prueba del paquete:

  python3 Scripts/measure_image_models.py --package cifar10 --write

Uso:  python3 Scripts/train_cifar10_model.py [--epochs 50] [--data-dir …] [--out-dir …] [--threads 24]
Requiere numpy y PyTorch (en la CPU, unos 30 s por época con 24 hilos).
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn

from cifar10_data import CLASS_LABELS, DEFAULT_DATA_DIR, TEST_FILES, TRAIN_FILES, cifar_dir, load_split

ROOT = Path(__file__).resolve().parent.parent
# Filtros de las Conv2D de cada bloque y lo que se apaga (Dropout) al final de cada uno
BLOCKS = [(32, 0.2), (64, 0.3), (128, 0.4)]
DENSE_UNITS = 256
DENSE_DROPOUT = 0.5


class Net(nn.Module):
    def __init__(self):
        super().__init__()
        layers, channels = [], 3
        for filters, dropout in BLOCKS:
            for _ in range(2):
                layers += [nn.Conv2d(channels, filters, 3, padding=1, bias=False), nn.BatchNorm2d(filters), nn.ReLU()]
                channels = filters
            layers += [nn.MaxPool2d(2), nn.Dropout(dropout)]
        self.features = nn.Sequential(*layers)
        self.dense = nn.Linear(channels * 4 * 4, DENSE_UNITS)
        self.dropout = nn.Dropout(DENSE_DROPOUT)
        self.output = nn.Linear(DENSE_UNITS, len(CLASS_LABELS))

    def forward(self, x):
        x = self.features(x)
        # Aplanado como en TF.js (channels_last): alto, ancho y canal
        x = x.permute(0, 2, 3, 1).reshape(x.shape[0], -1)
        return self.output(self.dropout(torch.relu(self.dense(x))))


def augment(x: torch.Tensor) -> torch.Tensor:
    """Recortes de 32×32 desplazados hasta 4 píxeles (con ceros en el margen) y la mitad, volteadas"""
    padded = nn.functional.pad(x, (4, 4, 4, 4))
    offsets = torch.randint(0, 9, (x.shape[0], 2))
    out = torch.stack([padded[i, :, dy:dy + 32, dx:dx + 32] for i, (dy, dx) in enumerate(offsets.tolist())])
    flip = torch.rand(x.shape[0]) < 0.5
    out[flip] = out[flip].flip(3)
    return out


def accuracy(model: nn.Module, images: np.ndarray, labels: np.ndarray) -> float:
    model.eval()
    hits = 0
    with torch.no_grad():
        for i in range(0, len(images), 1000):
            x = torch.from_numpy(images[i:i + 1000]).float() / 255
            hits += int((model(x).argmax(1).numpy() == labels[i:i + 1000]).sum())
    return hits / len(images)


def fused_weights(model: Net) -> list[np.ndarray]:
    """Los pesos como los espera TF.js (kernel, bias de cada capa), con cada BatchNormalization fundida en su Conv2D"""
    weights = []
    modules = list(model.features)
    for i, module in enumerate(modules):
        if not isinstance(module, nn.Conv2d):
            continue
        bn = modules[i + 1]
        scale = bn.weight.detach() / torch.sqrt(bn.running_var + bn.eps)
        kernel = module.weight.detach() * scale[:, None, None, None]
        bias = bn.bias.detach() - bn.running_mean * scale
        # (salida, entrada, alto, ancho) → (alto, ancho, entrada, salida)
        weights += [kernel.permute(2, 3, 1, 0).numpy(), bias.numpy()]
    for dense in (model.dense, model.output):
        weights += [dense.weight.detach().T.numpy(), dense.bias.detach().numpy()]
    return [np.ascontiguousarray(weight, dtype=np.float32) for weight in weights]


def fused_accuracy(weights: list[np.ndarray], images: np.ndarray, labels: np.ndarray) -> float:
    """La precisión de la red sin BatchNormalization (con los pesos fundidos): tiene que ser la misma"""
    tensors = [torch.from_numpy(weight) for weight in weights]
    convs = [(tensors[i], tensors[i + 1]) for i in range(0, 4 * len(BLOCKS), 2)]
    dense, dense_bias, output, output_bias = tensors[4 * len(BLOCKS):]
    hits = 0
    with torch.no_grad():
        for i in range(0, len(images), 1000):
            x = torch.from_numpy(images[i:i + 1000]).float() / 255
            for block in range(len(BLOCKS)):
                for kernel, bias in convs[2 * block:2 * block + 2]:
                    x = torch.relu(nn.functional.conv2d(x, kernel.permute(3, 2, 0, 1), bias, padding=1))
                x = nn.functional.max_pool2d(x, 2)
            x = x.permute(0, 2, 3, 1).reshape(x.shape[0], -1)
            x = torch.relu(x @ dense + dense_bias) @ output + output_bias
            hits += int((x.argmax(1).numpy() == labels[i:i + 1000]).sum())
    return hits / len(images)


def tfjs_layer(class_name: str, name: str, **config):
    return {'class_name': class_name, 'config': {**config, 'name': name, 'trainable': True}}


INITIALIZERS = {
    'kernel_initializer'  : {'class_name': 'VarianceScaling', 'config': {'scale': 1, 'mode': 'fan_avg', 'distribution': 'normal', 'seed': None}},
    'bias_initializer'    : {'class_name': 'Zeros', 'config': {}},
    'kernel_regularizer'  : None, 'kernel_constraint': None, 'bias_regularizer': None, 'activity_regularizer': None, 'bias_constraint': None,
}


def tfjs_model(weights: list[np.ndarray], metadata: dict):
    """El model.json de TF.js (una red Sequential, como la que guarda tfjs-layers) y la lista de sus pesos"""
    layers, names = [], []
    conv = pool = dropout = 0
    for filters, rate in BLOCKS:
        for _ in range(2):
            conv += 1
            name = f'conv2d_Conv2D{conv}'
            layers.append(tfjs_layer('Conv2D', name, filters=filters, kernel_size=[3, 3], strides=[1, 1], padding='same',
                                     data_format='channels_last', dilation_rate=[1, 1], activation='relu', use_bias=True,
                                     **INITIALIZERS, **({'batch_input_shape': [None, 32, 32, 3], 'dtype': 'float32'} if conv == 1 else {})))
            names += [f'{name}/kernel', f'{name}/bias']
        pool += 1
        dropout += 1
        layers.append(tfjs_layer('MaxPooling2D', f'max_pooling2d_MaxPooling2D{pool}', pool_size=[2, 2], padding='valid', strides=[2, 2], data_format='channels_last'))
        layers.append(tfjs_layer('Dropout', f'dropout_Dropout{dropout}', rate=rate, noise_shape=None, seed=None))
    layers.append(tfjs_layer('Flatten', 'flatten_Flatten1', data_format='channels_last'))
    layers.append(tfjs_layer('Dense', 'dense_Dense1', units=DENSE_UNITS, activation='relu', use_bias=True, **INITIALIZERS))
    layers.append(tfjs_layer('Dropout', f'dropout_Dropout{dropout + 1}', rate=DENSE_DROPOUT, noise_shape=None, seed=None))
    layers.append(tfjs_layer('Dense', 'dense_Dense2', units=len(CLASS_LABELS), activation='softmax', use_bias=True, **INITIALIZERS))
    names += ['dense_Dense1/kernel', 'dense_Dense1/bias', 'dense_Dense2/kernel', 'dense_Dense2/bias']
    return {
        'modelTopology'      : {'class_name': 'Sequential', 'config': {'name': 'sequential_1', 'layers': layers}, 'keras_version': 'tfjs-layers 4.22.0', 'backend': 'tensor_flow.js'},
        'weightsManifest'    : [{'paths': ['weights.bin'], 'weights': [{'name': name, 'shape': list(weight.shape), 'dtype': 'float32'} for name, weight in zip(names, weights)]}],
        'format'             : 'layers-model',
        'generatedBy'        : 'Scripts/train_cifar10_model.py (PyTorch)',
        'convertedBy'        : None,
        'userDefinedMetadata': metadata,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--batch-size', type=int, default=128)
    parser.add_argument('--data-dir', type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument('--out-dir', type=Path, default=ROOT / 'public' / 'n4l' / 'cifar10.n4l' / 'models' / 'cnn')
    parser.add_argument('--threads', type=int, default=24)
    parser.add_argument('--seed', type=int, default=1)
    args = parser.parse_args()

    torch.set_num_threads(args.threads)
    torch.manual_seed(args.seed)
    batches = cifar_dir(args.data_dir)
    train_images, train_labels = load_split(batches, TRAIN_FILES)
    test_images, test_labels = load_split(batches, TEST_FILES)

    model = Net()
    steps = args.epochs * ((len(train_images) + args.batch_size - 1) // args.batch_size)
    optimizer = torch.optim.SGD(model.parameters(), lr=0.05, momentum=0.9, nesterov=True, weight_decay=5e-4)
    schedule = torch.optim.lr_scheduler.OneCycleLR(optimizer, max_lr=0.1, total_steps=steps)
    loss_fn = nn.CrossEntropyLoss()
    x_all = torch.from_numpy(train_images)
    y_all = torch.from_numpy(train_labels)
    for epoch in range(1, args.epochs + 1):
        start = time.time()
        model.train()
        order = torch.randperm(len(x_all))
        total = 0.0
        for i in range(0, len(order), args.batch_size):
            index = order[i:i + args.batch_size]
            x = augment(x_all[index].float() / 255)
            loss = loss_fn(model(x), y_all[index])
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            schedule.step()
            total += loss.item() * len(index)
        print(f'Época {epoch}/{args.epochs}: pérdida {total / len(order):.4f} ({time.time() - start:.0f} s)', flush=True)

    test_accuracy = accuracy(model, test_images, test_labels)
    weights = fused_weights(model)
    fused = fused_accuracy(weights, test_images, test_labels)
    print(f'Precisión con las {len(test_images)} de prueba: {test_accuracy:.4f} (sin BatchNormalization: {fused:.4f})')
    if abs(fused - test_accuracy) > 0.002:
        raise SystemExit('Al fundir las BatchNormalization la red cambia: no se guarda')

    args.out_dir.mkdir(parents=True, exist_ok=True)
    (args.out_dir / 'weights.bin').write_bytes(b''.join(weight.tobytes() for weight in weights))
    metadata = {'dataset': 'CIFAR-10', 'classLabels': CLASS_LABELS, 'trainImages': len(train_images), 'testImages': len(test_images),
                'testAccuracy': round(fused, 4), 'epochs': args.epochs}
    (args.out_dir / 'model.json').write_text(json.dumps(tfjs_model(weights, metadata)))
    print(f'Modelo guardado en {args.out_dir}')


if __name__ == '__main__':
    main()
