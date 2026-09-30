#!/usr/bin/env python3
"""
Genera las imágenes de ejemplo del modelo KMNIST (public/assets/kmnist/0.png … 9.png): cada uno de los
10 caracteres hiragana escrito con una fuente, en negro sobre fondo blanco.

El carácter se encaja en un cuadrado de 200x200 centrado en la imagen de 280x280, la misma proporción
(20/28) con la que están centrados los caracteres en KMNIST y los dígitos en MNIST.

Uso:  python3 Scripts/build_kmnist_examples.py [--font /ruta/a/la/fuente.ttc]
Requiere Pillow y una fuente con hiragana (por defecto Noto Sans CJK JP Bold, del paquete fonts-noto-cjk).
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'kmnist'
DEFAULT_FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
# Los 10 caracteres de KMNIST (kmnist_classmap.csv), en el orden de las etiquetas
CHARS = ['お', 'き', 'す', 'つ', 'な', 'は', 'ま', 'や', 'れ', 'を']
SIZE = 280
BOX = 200


def load_font(path: str) -> ImageFont.FreeTypeFont:
    """La cara japonesa de la fuente: en las colecciones .ttc de Noto CJK hay una por idioma."""
    for index in range(16):
        try:
            font = ImageFont.truetype(path, 400, index=index)
        except OSError:
            break
        if 'JP' in font.getname()[0]:
            return font
    return ImageFont.truetype(path, 400)


def render(char: str, font: ImageFont.FreeTypeFont) -> Image.Image:
    # Se dibuja grande, se recorta al contorno del carácter y se encaja en BOX×BOX
    canvas = Image.new('L', (600, 600), 255)
    ImageDraw.Draw(canvas).text((100, 50), char, font=font, fill=0)
    glyph = canvas.crop(Image.eval(canvas, lambda v: 255 - v).getbbox())
    scale = BOX / max(glyph.size)
    glyph = glyph.resize((round(glyph.width * scale), round(glyph.height * scale)), Image.LANCZOS)
    image = Image.new('L', (SIZE, SIZE), 255)
    image.paste(glyph, ((SIZE - glyph.width) // 2, (SIZE - glyph.height) // 2))
    return image


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--font', default=DEFAULT_FONT)
    args = parser.parse_args()
    if not Path(args.font).exists():
        raise SystemExit(f'No existe la fuente {args.font}: instala fonts-noto-cjk o indica otra con --font')

    font = load_font(args.font)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for label, char in enumerate(CHARS):
        render(char, font).save(OUT_DIR / f'{label}.png', optimize=True)
    print(f'{len(CHARS)} imágenes en {OUT_DIR} con la fuente {" ".join(font.getname())}')


if __name__ == '__main__':
    main()
