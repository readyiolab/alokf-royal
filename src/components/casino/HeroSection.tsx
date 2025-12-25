import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import FloatingCards from "./FloatingCards";
import FloatingChips from "./FloatingChips";

const HeroSection = () => {
  const scrollToOffer = () => {
    document.getElementById('offer')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 "
        style={{
          backgroundImage: `url('/hero.webp')`,
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-casino-darker/90 via-background/85 to-casino-dark/95" />
      
      

      {/* Floating cards */}
      <FloatingCards />
      
      {/* Floating chips */}
      <FloatingChips />

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Logo */}
        <div className="mb-8 animate-fade-in-up">
          <img 
            src="/logo.webp" 
            alt="RoyalFlush.red" 
            className="h-24 md:h-44 mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <span className="gold-text ">Play the Cards</span>
          <br />
          <span className="text-foreground">That Define Your Destiny.</span>
        </h1>

        {/* Subline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          Where skill meets thrill.
        </p>

        
      </div>

      {/* Scroll indicator */}
      <button 
        onClick={scrollToAbout}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow cursor-pointer"
      >
        <ChevronDown className="w-8 h-8 text-primary/70" />
      </button>
    </section>
  );
};

export default HeroSection;
