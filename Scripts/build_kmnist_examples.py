#!/usr/bin/env python3
"""
Genera las imágenes de ejemplo del modelo KMNIST, en negro sobre fondo blanco:

  - public/assets/kmnist/0.png … 9.png: cada uno de los 10 caracteres hiragana como se escribe hoy, con una fuente.
  - public/assets/kmnist/forms/<código>.png: sus formas antiguas, las hentaigana de Unicode (de U+1B000
    en adelante, p. ej. 1B09E.png es HENTAIGANA LETTER HA-1), con una fuente que las tenga. Hasta 1900
    una misma sílaba se escribía de varias formas; en KMNIST aparecen escritas a mano bajo el carácter
    de hoy. Son de 112x112 (4 veces 28): se enseñan pequeñas y pesan poco.

El carácter se encaja en un cuadrado centrado que ocupa 20/28 de la imagen, la misma proporción con la
que están centrados los caracteres en KMNIST y los dígitos en MNIST.

Uso:  python3 Scripts/build_kmnist_examples.py [--font fuente.ttc] [--hentaigana-font fuente.ttf]
Requiere Pillow (y Python 3.11 o posterior, por los nombres Unicode de las hentaigana). Por defecto,
Noto Sans CJK JP Bold (paquete fonts-noto-cjk) para los de hoy y Noto Serif Hentaigana para los
antiguos, en negrita: https://github.com/google/fonts/tree/main/ofl/notoserifhentaigana (licencia OFL).
"""
import argparse
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'kmnist'
DEFAULT_FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
DEFAULT_HENTAIGANA_FONT = '/usr/share/fonts/truetype/noto/NotoSerifHentaigana[wght].ttf'
# Los 10 caracteres de KMNIST (kmnist_classmap.csv), en el orden de las etiquetas, con su sílaba en los nombres Unicode
CHARS = ['お', 'き', 'す', 'つ', 'な', 'は', 'ま', 'や', 'れ', 'を']
SYLLABLES = ['O', 'KI', 'SU', 'TU', 'NA', 'HA', 'MA', 'YA', 'RE', 'WO']
SIZE = 280
FORMS_SIZE = 112


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


def load_hentaigana_font(path: str) -> ImageFont.FreeTypeFont:
    """En negrita, como los de hoy: si la fuente es variable, con el eje de grosor a 700."""
    font = ImageFont.truetype(path, 400)
    try:
        font.set_variation_by_axes([700])
    except OSError:
        pass
    return font


def hentaigana(syllable: str) -> list[str]:
    """Las hentaigana de una sílaba, en el orden de Unicode (HENTAIGANA LETTER HA-1, HA-2…)."""
    prefix = f'HENTAIGANA LETTER {syllable}-'
    return [chr(code) for code in range(0x1B000, 0x1B130) if unicodedata.name(chr(code), '').startswith(prefix)]


def render(char: str, font: ImageFont.FreeTypeFont, size: int = SIZE) -> Image.Image:
    # Se dibuja grande, se recorta al contorno del carácter y se encaja en un cuadrado de 20/28 de la imagen
    canvas = Image.new('L', (700, 700), 255)
    ImageDraw.Draw(canvas).text((100, 50), char, font=font, fill=0)
    box = Image.eval(canvas, lambda v: 255 - v).getbbox()
    if box is None:
        raise SystemExit(f'La fuente no tiene U+{ord(char):04X}')
    glyph = canvas.crop(box)
    scale = size * 20 / 28 / max(glyph.size)
    glyph = glyph.resize((round(glyph.width * scale), round(glyph.height * scale)), Image.LANCZOS)
    image = Image.new('L', (size, size), 255)
    image.paste(glyph, ((size - glyph.width) // 2, (size - glyph.height) // 2))
    return image


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--font', default=DEFAULT_FONT)
    parser.add_argument('--hentaigana-font', default=DEFAULT_HENTAIGANA_FONT)
    args = parser.parse_args()
    if not Path(args.font).exists():
        raise SystemExit(f'No existe la fuente {args.font}: instala fonts-noto-cjk o indica otra con --font')
    if not Path(args.hentaigana_font).exists():
        raise SystemExit(f'No existe la fuente {args.hentaigana_font}: descarga Noto Serif Hentaigana '
                         'o indica otra con --hentaigana-font')

    font = load_font(args.font)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for label, char in enumerate(CHARS):
        render(char, font).save(OUT_DIR / f'{label}.png', optimize=True)
    print(f'{len(CHARS)} imágenes en {OUT_DIR} con la fuente {" ".join(font.getname())}')

    hentaigana_font = load_hentaigana_font(args.hentaigana_font)
    forms_dir = OUT_DIR / 'forms'
    forms_dir.mkdir(exist_ok=True)
    total = 0
    for char, syllable in zip(CHARS, SYLLABLES):
        forms = hentaigana(syllable)
        for form in forms:
            image = render(form, hentaigana_font, FORMS_SIZE)
            image.save(forms_dir / f'{ord(form):X}.png', optimize=True)
        total += len(forms)
        print(f'{char}: {len(forms)} formas antiguas')
    print(f'{total} imágenes en {forms_dir} con la fuente {hentaigana_font.getname()[0]}')


if __name__ == '__main__':
    main()
