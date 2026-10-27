export const THEMES = [
  {
    id: 'prune',
    name: 'Nuit prune',
    description: 'Cocon doux, lavande et pêche',
    colors: { bg: '#17131c', surface: '#221c29', border: '#342b3d', text: '#ede6f2', accent: '#c9a0e8', secondary: '#f2b5a0' },
  },
  {
    id: 'foret',
    name: 'Forêt de minuit',
    description: 'Apaisant, sauge et miel',
    colors: { bg: '#101614', surface: '#18211e', border: '#26332e', text: '#e4ede8', accent: '#7fc8a9', secondary: '#e8c27a' },
  },
  {
    id: 'terracotta',
    name: 'Terracotta tamisée',
    description: 'Chaleureux, feu de cheminée',
    colors: { bg: '#1a1513', surface: '#241d1a', border: '#382c27', text: '#f1e7e0', accent: '#e08e6d', secondary: '#d9b48f' },
  },
  {
    id: 'nuit',
    name: 'Bleu nuit et ambre',
    description: 'Calme, lampe de chevet',
    colors: { bg: '#0f1420', surface: '#171e2d', border: '#263047', text: '#e6eaf2', accent: '#f0b86e', secondary: '#8fb3f0' },
  },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'prune'

const STORAGE_KEY = 'chatonnerie-theme'

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value)
}

export function applyTheme(id: ThemeId) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]
  document.documentElement.dataset.theme = theme.id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg)
  try {
    localStorage.setItem(STORAGE_KEY, theme.id)
  } catch {}
}

export function restoreCachedTheme() {
  let cached: string | null = null
  try {
    cached = localStorage.getItem(STORAGE_KEY)
  } catch {}
  applyTheme(isThemeId(cached) ? cached : DEFAULT_THEME)
}
