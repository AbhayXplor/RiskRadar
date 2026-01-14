
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  return (
    <div className="min-h-screen bg-white">
      {view === 'landing' ? (
        <LandingPage onGetStarted={() => setView('dashboard')} />
      ) : (
        <Dashboard onBackToHome={() => setView('landing')} />
      )}
    </div>
  );
};

export default App;
