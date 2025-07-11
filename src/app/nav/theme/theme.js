import { createTheme } from '@mui/material/styles';

export const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  return {
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            '&.custom-navbar': {
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 26, 0.9)',
              color: isLight ? '#000000' : '#d4af37',
              border: `2px solid ${isLight ? '#000000' : '#d4af37'}`,
              '& .MuiButton-root': {
                color: isLight ? '#000000' : '#d4af37',
                '&:hover': {
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(212, 175, 55, 0.1)',
                },
              },
              '& .MuiIconButton-root': {
                color: isLight ? '#000000' : '#d4af37',
                border: `1px solid ${isLight ? '#000000' : '#d4af37'}`,
                '&:hover': {
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                },
              },
            },
          },
        },
      },
    },
    palette: {
      mode,
      ...(isLight ? {
        // Light theme
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
      } : {
        // Dark theme
        primary: {
          main: '#90caf9',
        },
        secondary: {
          main: '#f48fb1',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
        },
      }),
    },
    typography: {
      fontFamily: '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
  };
};

export const getTheme = (mode) => {
  return createTheme({
    ...getDesignTokens(mode),
  });
};
