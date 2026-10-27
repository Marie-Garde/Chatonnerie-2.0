export function formatSessionDate(date: string, options?: Intl.DateTimeFormatOptions) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year!, month! - 1, day).toLocaleDateString(
    'fr-FR',
    options ?? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  )
}
