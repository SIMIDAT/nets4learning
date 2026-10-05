"""
CIFAR-10 (https://www.cs.toronto.edu/~kriz/cifar.html), para Scripts/train_cifar10_model.py y
Scripts/build_cifar10_package.py: se descarga la primera vez (comprobando su MD5) y se leen sus imágenes y sus clases.
"""
import hashlib
import pickle
import tarfile
import urllib.request
from pathlib import Path

import numpy as np

CIFAR_URL = 'https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz'
CIFAR_MD5 = 'c58f30108f718f92721af3b95e74349a'
# En el orden de sus etiquetas (batches.meta)
CLASS_LABELS = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']
DEFAULT_DATA_DIR = Path.home() / '.cache' / 'nets4learning'
TRAIN_FILES = [f'data_batch_{i}' for i in range(1, 6)]
TEST_FILES = ['test_batch']


def cifar_dir(data_dir: Path = DEFAULT_DATA_DIR) -> Path:
    """La carpeta cifar-10-batches-py: si no está, se descarga (comprobando su MD5) y se descomprime"""
    batches = data_dir / 'cifar-10-batches-py'
    if batches.exists():
        return batches
    data_dir.mkdir(parents=True, exist_ok=True)
    archive = data_dir / 'cifar-10-python.tar.gz'
    if not archive.exists():
        print(f'Descargando {CIFAR_URL}…')
        urllib.request.urlretrieve(CIFAR_URL, archive)
    if hashlib.md5(archive.read_bytes()).hexdigest() != CIFAR_MD5:
        raise SystemExit(f'{archive}: el MD5 no es el de CIFAR-10')
    with tarfile.open(archive) as tar:
        tar.extractall(data_dir, filter='data')
    return batches


def load_split(batches: Path, files: list[str]):
    """Imágenes (n, 3, 32, 32) en uint8 y sus clases, en el orden de los ficheros"""
    images, labels = [], []
    for name in files:
        with open(batches / name, 'rb') as file:
            batch = pickle.load(file, encoding='bytes')
        images.append(batch[b'data'].reshape(-1, 3, 32, 32))
        labels.extend(batch[b'labels'])
    return np.concatenate(images), np.array(labels, dtype=np.int64)
