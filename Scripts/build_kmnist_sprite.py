#!/usr/bin/env python3
"""
Convierte KMNIST (los .npy de NumPy de public/datasets/03-image-classification/kmnist/) en el conjunto de su paquete
.n4l (public/n4l/kmnist.n4l/data/, kind image-sprite en su manifest.json), con el mismo formato que el de MNIST:

  - kmnist_images.png : sprite en escala de grises, una imagen de 28x28 por fila (784 px de ancho).
                        Primero las filas de entrenamiento y después las de test.
  - kmnist_labels_uint8: etiquetas en one-hot, 10 bytes por imagen, en el mismo orden.

Se toma un subconjunto equilibrado (el mismo número de imágenes de cada carácter): cada entrenamiento
en el navegador usa 11.000 imágenes de entrenamiento y 2.000 de test, así que no hace falta descargar
las 70.000 (unos 21 MB). Con los valores por defecto el sprite pesa ~7 MB.

Si cambia el número de imágenes, hay que cambiar también rows y train en el manifiesto (y medir de nuevo el modelo con
Scripts/measure_image_models.py --package kmnist --write).

Uso:  python3 Scripts/build_kmnist_sprite.py [--train-per-class 2000] [--test-per-class 500]
Requiere numpy y Pillow.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

KMNIST_DIR = Path(__file__).resolve().parent.parent / 'public' / 'datasets' / '03-image-classification' / 'kmnist'
OUT_DIR = Path(__file__).resolve().parent.parent / 'public' / 'n4l' / 'kmnist.n4l' / 'data'
NUM_CLASSES = 10


def balanced_subset(images: np.ndarray, labels: np.ndarray, per_class: int):
    """Las primeras `per_class` imágenes de cada clase, manteniendo el orden original del dataset."""
    keep = np.sort(np.concatenate([np.flatnonzero(labels == c)[:per_class] for c in range(NUM_CLASSES)]))
    return images[keep], labels[keep]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--train-per-class', type=int, default=2000)
    parser.add_argument('--test-per-class', type=int, default=500)
    args = parser.parse_args()

    parts = []
    for split, per_class in [('train', args.train_per_class), ('test', args.test_per_class)]:
        images = np.load(KMNIST_DIR / f'kmnist-{split}-imgs' / 'arr_0.npy')
        labels = np.load(KMNIST_DIR / f'kmnist-{split}-labels' / 'arr_0.npy')
        images, labels = balanced_subset(images, labels, per_class)
        print(f'{split}: {len(images)} imágenes ({per_class} por clase)')
        parts.append((images, labels))

    images = np.concatenate([p[0] for p in parts]).reshape(-1, 28 * 28).astype(np.uint8)
    labels = np.concatenate([p[1] for p in parts])

    sprite_path = OUT_DIR / 'kmnist_images.png'
    Image.fromarray(images, mode='L').save(sprite_path, format='PNG', optimize=True)

    labels_path = OUT_DIR / 'kmnist_labels_uint8'
    np.eye(NUM_CLASSES, dtype=np.uint8)[labels].tofile(labels_path)

    print(f'{sprite_path.name}: {images.shape[1]}x{images.shape[0]}, {sprite_path.stat().st_size / 1e6:.1f} MB')
    print(f'{labels_path.name}: {labels_path.stat().st_size} bytes')
    print(f'Imágenes de entrenamiento (para la app): {len(parts[0][0])}, total: {len(images)}')


if __name__ == '__main__':
    main()
