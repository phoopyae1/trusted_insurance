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

const basePalette = {
  primary: { main: '#0A2540' },
  secondary: { main: '#0FB9B1' },
  info: { main: '#38BDF8' },
  warning: { main: '#F59E0B' },
};

export function ThemeRegistry({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const toggle = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...basePalette,
          background:
            mode === 'light'
              ? {
                  default: '#F9FAFB',
                  paper: '#FFFFFF',
                }
              : {
                  default: '#0B1220',
                  paper: '#111827',
                },
          text:
            mode === 'light'
              ? { primary: '#111827', secondary: '#4B5563' }
              : { primary: '#F9FAFB', secondary: '#9CA3AF' },
        },
        shape: {
          borderRadius: 6,
        },
        typography: {
          fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          h4: { fontWeight: 700 },
          h5: { fontWeight: 700 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiButton: {
            defaultProps: {
              variant: 'contained',
            },
            styleOverrides: {
              root: {
                borderRadius: 6,
                paddingLeft: 20,
                paddingRight: 20,
              },
              containedPrimary: {
                boxShadow: '0px 12px 30px rgba(10, 37, 64, 0.22)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.2)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage:
                  'linear-gradient(135deg, rgba(10, 37, 64, 0.98), rgba(15, 185, 177, 0.9))',
                backdropFilter: 'blur(12px)',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRight: '1px solid rgba(148, 163, 184, 0.25)',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
              },
            },
          },
        },
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
