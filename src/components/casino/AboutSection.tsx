import { useInView } from "@/hooks/useInView";

const AboutSection = () => {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section id="about" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-casino-dark via-background to-casino-dark" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image side */}
          <div className={`relative transition-all duration-1000 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative rounded-2xl overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-transparent pointer-events-none z-10" />
              
              {/* Casino image */}
              <img 
                src="/image1.webp"
                alt="Casino poker chips"
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
            
            {/* Floating card decoration */}
            <div className="absolute -bottom-4 -right-4 w-24 h-32 bg-red-700 rounded-lg border border-primary/30 shadow-xl transform rotate-12 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary">A</span>
              <span className="text-3xl text-primary">♠</span>
            </div>
          </div>

          {/* Content side */}
          <div className={`space-y-6 transition-all duration-1000 delay-300 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              <span className="gold-text">Premium Poker</span>
              <br />
              <span className="text-foreground">Experience</span>
            </h2>
            
            <div className="w-20 h-1 gold-gradient rounded-full" />
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Step into the world of elite gaming at RoyalFlush.red. We offer an unmatched 
              skill-based poker experience where strategy meets sophistication. Our premium 
              tables are designed for players who appreciate the finer aspects of the game.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you're a seasoned pro or an ambitious newcomer, our luxury atmosphere 
              and fair play guarantee ensure every hand you play is a memorable one. Join the 
              elite circle of players who know that true victory comes from skill, not luck.
            </p>
            
            <div className="flex gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-display font-bold gold-text">500+</div>
                <div className="text-sm text-muted-foreground">Active Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold gold-text">₹50L+</div>
                <div className="text-sm text-muted-foreground">Monthly Prizes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold gold-text">24/7</div>
                <div className="text-sm text-muted-foreground">Live Tables</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
