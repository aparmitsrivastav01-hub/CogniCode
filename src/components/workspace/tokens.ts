export interface WorkspaceThemeTokens {
  bg: string;
  surface: string;
  card: string;
  cardBorder: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentHover: string;
  accentDim: string;
  success: string;
  successDim: string;
  danger: string;
  dangerDim: string;
  textPrimary: string;
  textMuted: string;
  textDim: string;
  fontSans: string;
  fontMono: string;
}

export const workspaceTokens: WorkspaceThemeTokens = {
  bg: '#000000',
  surface: '#000000',
  card: '#08080a',
  cardBorder: '#1a1a24',
  border: '#1a1a24',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  accent: '#6366f1',
  accentHover: '#7c3aed',
  accentDim: 'rgba(99, 102, 241, 0.15)',
  success: '#22c55e',
  successDim: 'rgba(34, 197, 94, 0.15)',
  danger: '#f43f5e',
  dangerDim: 'rgba(244, 63, 94, 0.15)',
  textPrimary: '#e5e7eb',
  textMuted: '#8b93a7',
  textDim: '#6b7280',
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', 'DM Mono', SFMono-Regular, Menlo, monospace",
};
