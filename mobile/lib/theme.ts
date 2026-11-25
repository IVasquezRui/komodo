// ============================================================
//  KOMODO — Design System / Theme Tokens
//  Paleta oficial Komodo + Superficies tintadas con profundidad
// ============================================================

export const theme = {
  colors: {
    // ── Marca Primaria (Púrpura Komodo) ────────────────────
    primary: '#6D28D9',           // Purple-700 base
    primaryVibrant: '#7C3AED',    // Purple-600 vibrante / hover
    primaryDeep: '#4C1D95',       // Purple-900 profundo
    primaryContainer: '#EDE9FE',  // Lavanda suave para chips/badges

    // ── Acción / CTA Principal (Verde Komodo) ──────────────
    action: '#10B981',            // Emerald-500 CTA principal
    actionHover: '#059669',       // Emerald-600 active / pressed
    actionContainer: '#D1FAE5',   // Fondo suave CTA / disponible

    // ── Acentos Secundarios ────────────────────────────────
    info: '#06B6D4',              // Cyan-500 (WiFi, rutas, información)
    infoContainer: '#CFFAFE',
    accent: '#F59E0B',            // Amber-500 (paradas de descanso, alertas)
    accentContainer: '#FEF3C7',

    // ── Semánticos ─────────────────────────────────────────
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',

    // ── Superficies con profundidad (adiós blanco plano) ───
    background: '#FFFFFF',        // Tarjetas elevadas
    surface: '#F5F3FF',           // Fondo lavanda ultra-suave
    surfaceSlate: '#F8FAFC',      // Fondo slate frío secundario
    surfaceContainer: '#EDE9FE',  // Contenedores tintados suaves
    surfaceMuted: '#F1F5F9',      // Inputs / chips neutros

    // ── Superficies Oscuras / Headers ──────────────────────
    darkSurface: '#130F26',
    darkCard: '#1E1838',

    // ── Texto (Contraste WCAG AA) ──────────────────────────
    textPrimary: '#1E1B4B',       // Indigo-950 legible y profundo
    textSecondary: '#475569',     // Slate-600
    textMuted: '#64748B',         // Slate-500
    textOnBrand: '#FFFFFF',

    // ── Bordes Tintados ────────────────────────────────────
    border: '#DDD6FE',            // Borde lavanda suave (Violet-200)
    borderSlate: '#E2E8F0',       // Slate-200
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  typography: {
    fontFamily: undefined,
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      xxl: 30,
      xxxl: 36,
    },
  },

  shadows: {
    sm: {
      shadowColor: '#4C1D95',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: '#4C1D95',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 4,
    },
    lg: {
      shadowColor: '#4C1D95',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
