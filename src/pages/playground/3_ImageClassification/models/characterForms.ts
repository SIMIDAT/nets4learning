/** Una forma antigua de un carácter: su imagen y el kanji del que viene */
export type OldForm_t = {
  /** Imagen, relativa a public/assets/ */
  image : string
  origin: string
}

/** Un carácter que se escribía de varias formas: cómo es hoy y sus formas antiguas, para enseñarlas juntas */
export type CharacterForms_t = {
  /** El carácter de hoy */
  char   : string
  /** Cómo se lee (en rōmaji) */
  reading: string
  /** El kanji del que viene la forma de hoy */
  origin : string
  /** Imagen del carácter de hoy, relativa a public/assets/ */
  modern : string
  /** Formas antiguas: las FEATURED_FORMS primeras se enseñan en los ejemplos; todas, en la información del modelo */
  old    : OldForm_t[]
}

/** Formas antiguas de cada carácter en los ejemplos */
export const FEATURED_FORMS = 3

// Las hentaigana de Unicode de cada sílaba (código y kanji del que viene, según NamesList.txt), dibujadas con Noto Serif
// Hentaigana por Scripts/build_kmnist_examples.py. Primero, las tres de los ejemplos, de kanji distintos: cuando la hay,
// una del mismo kanji que la forma de hoy pero escrito de otra manera. Después, las demás, en el orden de Unicode
const HENTAIGANA: Record<string, [string, string][]> = {
  お: [['1B014', '於'], ['1B015', '於'], ['1B016', '隱']],
  き: [['1B025', '幾'], ['1B02A', '起'], ['1B026', '支'], ['1B023', '喜'], ['1B024', '幾'], ['1B027', '木'], ['1B028', '祈'], ['1B029', '貴']],
  す: [['1B051', '須'], ['1B04F', '春'], ['1B04B', '壽'], ['1B04A', '受'], ['1B04C', '數'], ['1B04D', '數'], ['1B04E', '春'], ['1B050', '須']],
  つ: [['1B06A', '川'], ['1B06B', '津'], ['1B06D', '徒'], ['1B069', '川'], ['1B06C', '都']],
  な: [['1B081', '奈'], ['1B085', '那'], ['1B07E', '南'], ['1B07F', '名'], ['1B080', '奈'], ['1B082', '奈'], ['1B083', '菜'], ['1B084', '那'], ['1B086', '難']],
  は: [['1B09E', '八'], ['1B0A6', '者'], ['1B0A1', '波'], ['1B09F', '半'], ['1B0A0', '婆'], ['1B0A2', '盤'], ['1B0A3', '盤'], ['1B0A4', '破'], ['1B0A5', '者'], ['1B0A7', '葉'], ['1B0A8', '頗']],
  ま: [['1B0C2', '万'], ['1B0C5', '滿'], ['1B0C4', '末'], ['1B0C3', '末'], ['1B0C6', '滿'], ['1B0C7', '萬'], ['1B0C8', '麻']],
  や: [['1B0DE', '也'], ['1B0DF', '屋'], ['1B0E2', '夜'], ['1B0DD', '也'], ['1B0E0', '耶'], ['1B0E1', '耶']],
  れ: [['1B100', '連'], ['1B0FF', '禮'], ['1B101', '麗'], ['1B0FE', '禮']],
  を: [['1B11A', '越'], ['1B11C', '遠'], ['1B116', '乎'], ['1B117', '乎'], ['1B118', '尾'], ['1B119', '緒'], ['1B11B', '遠']],
}

// En el orden de las etiquetas de KMNIST (kmnist_classmap.csv); el de hoy, escrito con Noto Sans CJK JP
export const KMNIST_CHARACTERS: CharacterForms_t[] = [
  { char: 'お', reading: 'o', origin: '於' },
  { char: 'き', reading: 'ki', origin: '幾' },
  { char: 'す', reading: 'su', origin: '寸' },
  { char: 'つ', reading: 'tsu', origin: '川' },
  { char: 'な', reading: 'na', origin: '奈' },
  { char: 'は', reading: 'ha', origin: '波' },
  { char: 'ま', reading: 'ma', origin: '末' },
  { char: 'や', reading: 'ya', origin: '也' },
  { char: 'れ', reading: 're', origin: '礼' },
  { char: 'を', reading: 'wo', origin: '遠' },
].map((character, label) => ({
  ...character,
  modern: `kmnist/${label}.png`,
  old   : HENTAIGANA[character.char].map(([code, origin]) => ({ image: `kmnist/forms/${code}.png`, origin })),
}))
