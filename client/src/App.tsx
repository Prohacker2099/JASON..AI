import React from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import ResponsiveLayout from './components/ResponsiveLayout';
import UltimateJasonUI from './components/UltimateJasonUI';
import './styles/App.scss';
import './styles/responsive.scss';
import './styles/themes.scss';

function App() {
  return (
    <ThemeProvider defaultTheme="quantum">
      <ResponsiveLayout className="jason-app">
        <UltimateJasonUI />
      </ResponsiveLayout>
    </ThemeProvider>
  );
}

export default App;
