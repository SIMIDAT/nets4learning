#!/usr/bin/env python3
"""
Genera las imágenes de ejemplo del paquete de MNIST (public/n4l/mnist.n4l/examples/0.png … 9.png): cada dígito escrito con una
fuente, en negro sobre fondo blanco, encajado como los de KMNIST (Scripts/build_kmnist_examples.py) y como MNIST
centra sus dígitos: en un cuadrado de 20/28 de la imagen.

Por defecto, Lato Bold (paquete fonts-lato, licencia OFL): de las fuentes probadas, la red de MNIST reconoce sus diez
dígitos (con otras, el 6 o el 7 se confunden).

Uso:  python3 Scripts/build_mnist_examples.py [--font /ruta/a/la/fuente.ttf]
Requiere Pillow.
"""
import argparse
from pathlib import Path

from PIL import ImageFont

from build_kmnist_examples import render

OUT_DIR = Path(__file__).resolve().parent.parent / 'public' / 'n4l' / 'mnist.n4l' / 'examples'
DEFAULT_FONT = '/usr/share/fonts/truetype/lato/Lato-Bold.ttf'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--font', default=DEFAULT_FONT)
    args = parser.parse_args()
    if not Path(args.font).exists():
        raise SystemExit(f'No existe la fuente {args.font}: instala fonts-lato o indica otra con --font')

    font = ImageFont.truetype(args.font, 400)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for digit in range(10):
        render(str(digit), font).save(OUT_DIR / f'{digit}.png', optimize=True)
    print(f'10 imágenes en {OUT_DIR} con la fuente {" ".join(font.getname())}')


if __name__ == '__main__':
    main()
