'use client';

import React, { createContext, useMemo, useState, ReactNode, useContext } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

interface ThemeContextValue {
  mode: 'light' | 'dark';
  toggle: () => void;
}

const ColorModeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} });

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function ThemeRegistry({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const toggle = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#0066cc' },
          secondary: { main: '#00bfa6' }
        },
        components: {
          MuiButton: {
            defaultProps: {
              variant: 'contained'
            }
          }
        }
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
