export type ThemePreset = 'steel' | 'sand' | 'forest'
export type DensityMode = 'comfortable' | 'compact'
export type RadiusMode = 'rounded' | 'sharp'
export type ShadowMode = 'soft' | 'flat'

export interface UISettings {
  themePreset: ThemePreset
  density: DensityMode
  radius: RadiusMode
  shadow: ShadowMode
  accentHeader: boolean
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  themePreset: 'steel',
  density: 'comfortable',
  radius: 'rounded',
  shadow: 'soft',
  accentHeader: true,
}

const THEME_TOKENS: Record<ThemePreset, Record<string, string>> = {
  steel: {
    '--ui-page-bg': 'linear-gradient(160deg, #eef2f7 0%, #e7edf5 100%)',
    '--ui-header-bg': 'linear-gradient(90deg, #1f2a5f 0%, #283b85 100%)',
    '--ui-header-text': '#e6ecff',
    '--ui-panel-bg': '#fdfefe',
    '--ui-panel-border': '#cad5e3',
    '--ui-title': '#111827',
    '--ui-muted': '#4b5563',
    '--ui-accent': '#4f6adf',
  },
  sand: {
    '--ui-page-bg': 'linear-gradient(170deg, #f7f1e8 0%, #efe4d5 100%)',
    '--ui-header-bg': 'linear-gradient(90deg, #5a4935 0%, #7f6648 100%)',
    '--ui-header-text': '#fff4e3',
    '--ui-panel-bg': '#fffdf9',
    '--ui-panel-border': '#dacdbb',
    '--ui-title': '#2a2117',
    '--ui-muted': '#655442',
    '--ui-accent': '#b7791f',
  },
  forest: {
    '--ui-page-bg': 'linear-gradient(165deg, #edf5ef 0%, #e2eee7 100%)',
    '--ui-header-bg': 'linear-gradient(90deg, #1b4d3e 0%, #266b54 100%)',
    '--ui-header-text': '#e9fff4',
    '--ui-panel-bg': '#fbfefc',
    '--ui-panel-border': '#bfd8cb',
    '--ui-title': '#10291f',
    '--ui-muted': '#3d5a4f',
    '--ui-accent': '#2f855a',
  },
}

export function applyUISettings(settings: UISettings): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const tokens = THEME_TOKENS[settings.themePreset]

  Object.entries(tokens).forEach(([token, value]) => {
    root.style.setProperty(token, value)
  })

  root.style.setProperty('--ui-radius', settings.radius === 'rounded' ? '12px' : '6px')
  root.style.setProperty('--ui-padding-y', settings.density === 'compact' ? '8px' : '12px')
  root.style.setProperty('--ui-padding-x', settings.density === 'compact' ? '10px' : '14px')
  root.style.setProperty(
    '--ui-shadow',
    settings.shadow === 'flat' ? '0 1px 0 rgba(15, 23, 42, 0.08)' : '0 10px 30px rgba(15, 23, 42, 0.12)'
  )
  root.style.setProperty('--ui-header-accent-opacity', settings.accentHeader ? '1' : '0')
}

export function readUISettings(): UISettings {
  if (typeof window === 'undefined') return DEFAULT_UI_SETTINGS
  const raw = localStorage.getItem('psb-ui-settings')
  if (!raw) return DEFAULT_UI_SETTINGS

  try {
    return { ...DEFAULT_UI_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_UI_SETTINGS
  }
}
