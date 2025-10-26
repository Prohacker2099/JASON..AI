import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#4f46e5' },
      background: { default: '#f8fafc' },
    },
    shape: { borderRadius: 8 },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
