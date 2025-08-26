import { createTheme } from '@mui/material/styles';

// Gold color palette
const GOLD = {
  50: '#fff8e1',
  100: '#ffecb3',
  200: '#ffe082',
  300: '#ffd54f',
  400: '#ffca28',
  500: '#d4af37', // Main gold
  600: '#ffb300',
  700: '#ffa000',
  800: '#ff8f00',
  900: '#ff6f00',
};

// Black color palette
const BLACK = {
  50: '#f5f5f5',
  100: '#e0e0e0',
  200: '#bdbdbd',
  300: '#9e9e9e',
  400: '#757575',
  500: '#212121', // Main black
  600: '#424242',
  700: '#303030',
  800: '#212121',
  900: '#121212',
};

export const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  return {
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            '&.custom-navbar': {
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(18, 18, 18, 0.95)',
              color: isLight ? BLACK[900] : GOLD[500],
              borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(212, 175, 55, 0.2)'}`,
              '& .MuiButton-root': {
                color: isLight ? BLACK[900] : GOLD[500],
                '&:hover': {
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(212, 175, 55, 0.1)',
                },
              },
              '& .MuiIconButton-root': {
                color: isLight ? BLACK[900] : GOLD[500],
                '&:hover': {
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(212, 175, 55, 0.1)',
                },
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            backgroundColor: GOLD[500],
            color: BLACK[900],
            '&:hover': {
              backgroundColor: GOLD[600],
              boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
            },
          },
          outlined: {
            color: isLight ? BLACK[900] : GOLD[500],
            borderColor: isLight ? 'rgba(0, 0, 0, 0.23)' : 'rgba(212, 175, 55, 0.5)',
            '&:hover': {
              borderColor: GOLD[500],
              backgroundColor: isLight ? 'rgba(212, 175, 55, 0.04)' : 'rgba(212, 175, 55, 0.08)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)',
            color: isLight ? BLACK[900] : GOLD[500],
            fontWeight: 600,
          },
        },
      },
    },
    palette: {
      mode,
      primary: {
        main: GOLD[500],
        light: GOLD[300],
        dark: GOLD[700],
        contrastText: BLACK[900],
      },
      secondary: {
        main: isLight ? BLACK[500] : GOLD[300],
        light: isLight ? BLACK[300] : GOLD[200],
        dark: isLight ? BLACK[700] : GOLD[600],
        contrastText: isLight ? '#fff' : BLACK[900],
      },
      background: {
        default: isLight ? '#f8f9fa' : BLACK[900],
        paper: isLight ? '#ffffff' : BLACK[800],
      },
      text: {
        primary: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
        disabled: isLight ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.5)',
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
      fontFamily: '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        color: isLight ? BLACK[900] : GOLD[400],
      },
      h2: {
        fontWeight: 600,
        color: isLight ? BLACK[900] : GOLD[400],
      },
      h3: {
        fontWeight: 500,
        color: isLight ? BLACK[900] : GOLD[400],
      },
      h4: {
        color: isLight ? BLACK[900] : GOLD[400],
      },
      h5: {
        color: isLight ? BLACK[900] : GOLD[400],
      },
      h6: {
        color: isLight ? BLACK[900] : GOLD[400],
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
  };
};

export const getTheme = (mode) => {
  return createTheme({
    ...getDesignTokens(mode),
  });
};