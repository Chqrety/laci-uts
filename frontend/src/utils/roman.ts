export const ROMAN_MONTHS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
] as const

export type RomanMonth = typeof ROMAN_MONTHS[number]

/**
 * Mendapatkan bulan Romawi saat ini (1-indexed berdasarkan bulan berjalan).
 */
export function getCurrentRomanMonth(): RomanMonth {
  return ROMAN_MONTHS[new Date().getMonth()] ?? 'I'
}

/**
 * Mengonversi indeks bulan (0-11) ke angka Romawi.
 */
export function monthIndexToRoman(monthIndex: number): RomanMonth {
  return ROMAN_MONTHS[monthIndex] ?? 'I'
}

/**
 * Memvalidasi apakah string merupakan bulan Romawi valid (I - XII).
 */
export function isValidRomanMonth(val: string): val is RomanMonth {
  return (ROMAN_MONTHS as readonly string[]).includes(val.trim().toUpperCase())
}
