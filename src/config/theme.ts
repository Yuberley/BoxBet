/**
 * Sistema de temas personalizable para BoxBet
 * Modifica estos valores para cambiar el aspecto visual del juego
 * manteniendo el diseño intacto
 */

export interface Theme {
  // Colores principales
  colors: {
    primary: string;
    primaryHover: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryHover: string;
    accent: string;
    
    // Fondos
    background: {
      light: string;
      dark: string;
      gradient: {
        from: string;
        to: string;
      };
    };
    
    // Superficies (cards, paneles)
    surface: {
      light: string;
      dark: string;
    };
    
    // Bordes
    border: {
      light: string;
      dark: string;
    };
    
    // Textos
    text: {
      primary: string;
      secondary: string;
      muted: string;
      mutedDark: string;
    };
    
    // Estados
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Tipografía
  fonts: {
    display: string; // Títulos y encabezados
    body: string;    // Texto general
  };
  
  // Espaciado y tamaños
  spacing: {
    headerHeight: string;
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
  };
  
  // Sombras
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    glow: string;
  };
  
  // Animaciones
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      default: string;
      smooth: string;
      bounce: string;
    };
  };
}

// Tema por defecto (oscuro)
export const defaultTheme: Theme = {
  colors: {
    primary: '#38bdf8',        // Cyan/Sky blue
    primaryHover: '#0ea5e9',   // Darker cyan
    primaryDark: '#0284c7',    // Deep cyan
    primaryLight: '#7dd3fc',   // Light cyan
    secondary: '#eab308',      // Yellow/Gold
    secondaryHover: '#ca8a04',
    accent: '#f59e0b',         // Amber
    
    background: {
      light: '#f8fafc',        // Slate 50
      dark: '#0f172a',         // Slate 950
      gradient: {
        from: '#1e293b',       // Slate 800
        to: '#0f172a',         // Slate 950
      },
    },
    
    surface: {
      light: '#ffffff',
      dark: '#1e293b',         // Slate 800
    },
    
    border: {
      light: '#e2e8f0',        // Slate 200
      dark: '#334155',         // Slate 700
    },
    
    text: {
      primary: '#0f172a',      // Slate 950
      secondary: '#475569',    // Slate 600
      muted: '#94a3b8',        // Slate 400
      mutedDark: '#64748b',    // Slate 500
    },
    
    success: '#22c55e',        // Green
    warning: '#eab308',        // Yellow
    error: '#ef4444',          // Red
    info: '#3b82f6',           // Blue
  },
  
  fonts: {
    display: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  
  spacing: {
    headerHeight: '64px',
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(56, 189, 248, 0.5)',
  },
  
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'ease',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

// Tema alternativo (claro/light mode - opcional)
export const lightTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: {
      light: '#ffffff',
      dark: '#f8fafc',
      gradient: {
        from: '#ffffff',
        to: '#f1f5f9',
      },
    },
    surface: {
      light: '#ffffff',
      dark: '#f8fafc',
    },
    border: {
      light: '#e2e8f0',
      dark: '#cbd5e1',
    },
  },
};

// Hook para obtener el tema actual
export const useTheme = () => {
  // Por ahora retorna el tema por defecto
  // En el futuro puedes implementar un context para cambiar temas
  return defaultTheme;
};

// Función helper para generar clases CSS con el tema
export const getThemeClasses = (theme: Theme) => ({
  // Backgrounds
  bgPrimary: { backgroundColor: theme.colors.primary },
  bgSecondary: { backgroundColor: theme.colors.secondary },
  bgSurface: { backgroundColor: theme.colors.surface.dark },
  bgSurfaceLight: { backgroundColor: theme.colors.surface.light },
  
  // Text colors
  textPrimary: { color: theme.colors.primary },
  textSecondary: { color: theme.colors.secondary },
  textMuted: { color: theme.colors.text.muted },
  
  // Borders
  borderPrimary: { borderColor: theme.colors.primary },
  borderLight: { borderColor: theme.colors.border.light },
  borderDark: { borderColor: theme.colors.border.dark },
});

export default defaultTheme;
