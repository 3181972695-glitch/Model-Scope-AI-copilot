import { useState, useCallback, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeatureCards from './components/FeatureCards';
import ChatDemo from './components/ChatDemo';
import AIDisclosure from './components/AIDisclosure';
import Footer from './components/Footer';

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="返回顶部"
      className="back-to-top fixed bottom-6 right-6 z-50 w-11 h-11 rounded-2xl bg-indigo-500/90 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
    >
      <ArrowUp size={18} />
    </button>
  );
}

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
      <BackToTop />
    </div>
  );
}

export default App;
