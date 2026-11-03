export const idLongDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const idDateOnlyFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const idDateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Format tanggal dengan jam dan menit untuk riwayat log (e.g., 27 Okt 2026, 17.30).
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return idDateTimeFormatter.format(date)
}

/**
 * Format tanggal lengkap dengan hari (e.g., Selasa, 27 Oktober 2026).
 */
export function formatLongDate(date: Date = new Date()): string {
  return idLongDateFormatter.format(date)
}

/**
 * Format tanggal tanpa nama hari (e.g., 27 Oktober 2026).
 */
export function formatDateOnly(date: Date = new Date()): string {
  return idDateOnlyFormatter.format(date)
}

/**
 * Format tanggal ringkas untuk penamaan berkas (e.g., 27Okt2026).
 */
export function formatCompactFileDate(date: Date = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day}${month}${year}`
}
