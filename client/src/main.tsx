import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PowerGrid } from './components/PowerGrid';
import DevGallery from './DevGallery';
import SelfLearningPanel from './components/SelfLearningPanel';
import EthicsPanel from './components/EthicsPanel';
import ConsciousPanel from './components/ConsciousPanel';
import './index.css';
import AppThemeProvider from './theme/AppThemeProvider';
import JEye from './components/JEye';
import TravelReviewPanel from './components/TravelReviewPanel';
import HandsConsole from './components/HandsConsole';

const AppRouter: React.FC = () => {
  const [hash, setHash] = useState<string>(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hash === '#/dev') {
    return <DevGallery />;
  }
  if (hash === '#/power') {
    return <PowerGrid />;
  }
  if (hash === '#/ai') {
    return <SelfLearningPanel />;
  }
  if (hash === '#/ethics') {
    return <EthicsPanel />;
  }
  if (hash === '#/conscious') {
    return <ConsciousPanel />;
  }
  if (hash === '#/travel') {
    return <TravelReviewPanel />;
  }
  if (hash === '#/hands') {
    return <HandsConsole />;
  }
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <AppRouter />
      <JEye />
    </AppThemeProvider>
  </React.StrictMode>,
);
