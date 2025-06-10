import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Benefits from '../components/landing/Benefits';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen">
      <Header onGetStarted={onGetStarted} />
      
      <main>
        <Hero onGetStarted={onGetStarted} />
        
        <section id="features">
          <Features />
        </section>
        
        <section id="how-it-works">
          <HowItWorks />
        </section>
        
        <section id="benefits">
          <Benefits />
        </section>
        
        <CTA onGetStarted={onGetStarted} />
      </main>
      
      <Footer />
    </div>
  );
};

export default LandingPage;