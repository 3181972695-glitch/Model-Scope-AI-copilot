import { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeatureCards from './components/FeatureCards';
import ChatDemo from './components/ChatDemo';
import AIDisclosure from './components/AIDisclosure';
import Footer from './components/Footer';

function App() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const handleSelectFeature = useCallback((id: string) => {
    setActiveFeature(id);
  }, []);

  const handleBack = useCallback(() => {
    setActiveFeature(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <Navbar />
      <main>
        <Hero />
        <FeatureCards activeFeature={activeFeature} onSelect={handleSelectFeature} />
        <ChatDemo feature={activeFeature} onBack={handleBack} />
        <AIDisclosure />
      </main>
      <Footer />
    </div>
  );
}

export default App;
