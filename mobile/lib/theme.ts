// ============================================================
//  KOMODO — Design System / Theme
//  Todos los tokens de diseño centralizados
// ============================================================

export const theme = {
  colors: {
    // ── Marca ──────────────────────────────────────────────
    primary: '#4F46E5',           // Indigo — color principal
    primaryContainer: '#EEF2FF', // Fondo suave para chips/badges
    action: '#0D9488',            // Teal — botones de acción
    accent: '#F59E0B',            // Amber Gold — FAB, destacados

    // ── Semánticos ─────────────────────────────────────────
    error: '#DC2626',             // Rojo — errores y alertas
    success: '#10B981',           // Esmeralda — estados OK
    warning: '#F59E0B',           // Amber — advertencias

    // ── Superficies ────────────────────────────────────────
    background: '#FFFFFF',        // Fondo principal (cards, pantallas blancas)
    surface: '#F7F9FB',           // Fondo de pantallas completas
    surfaceContainer: '#F1F5F9',  // Inputs, chips, fondos suaves

    // ── Texto ──────────────────────────────────────────────
    textPrimary: '#1E293B',       // Slate-800 — texto principal
    textSecondary: '#64748B',     // Slate-500 — texto secundario
    textMuted: '#94A3B8',         // Slate-400 — placeholders, hints

    // ── Bordes ─────────────────────────────────────────────
    border: '#E2E8F0',            // Slate-200
  },

  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,      // Botones e inputs estándar
    xxl: 24,     // Cards principales
    xxxl: 32,    // Cards grandes
    full: 9999,  // Chips pill / badges
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // ── Tipografía ─────────────────────────────────────────
  typography: {
    // En React Native (Expo): usa la fuente del sistema (SF Pro en iOS, Roboto en Android)
    // Para Swift/SwiftUI: se usará SF Pro explícitamente
    fontFamily: undefined, // undefined = fuente del sistema nativo
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

  // ── Sombras ────────────────────────────────────────────
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
    },
  },
};

// ── Tipo exportado para uso en componentes ────────────────
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
