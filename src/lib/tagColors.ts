export const TAG_COLORS = {
  lavande: '#c9a0e8',
  peche: '#f2b5a0',
  sauge: '#7fc8a9',
  miel: '#e8c27a',
  ciel: '#8fb3f0',
  rose: '#f2a7c3',
  corail: '#e08e6d',
  gris: '#a497b0',
} as const

export type TagColor = keyof typeof TAG_COLORS

export const TAG_COLOR_KEYS = Object.keys(TAG_COLORS) as TagColor[]

export function tagHex(color: string | undefined) {
  return TAG_COLORS[(color ?? 'gris') as TagColor] ?? TAG_COLORS.gris
}

export function colorForName(name: string): TagColor {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TAG_COLOR_KEYS[hash % TAG_COLOR_KEYS.length]!
}

export function normalizeTagName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
