import { useInView } from "@/hooks/useInView";
import { Zap, Shield, Lock, Video,ArrowBigDown } from "lucide-react";

const features = [
  {
    icon: ArrowBigDown,
    title: "Instant Cashouts",
    description: "Withdraw your winnings instantly to your bank account. No delays, no hassle.",
    backContent: "Process withdrawals within minutes with our secure payment partners.",
  },
  {
    icon: Shield,
    title: "Fair Play Guaranteed",
    description: "Certified RNG systems and transparent gameplay mechanics for all players.",
    backContent: "Third-party audited systems ensure every game is 100% fair.",
  },
  {
    icon: Lock,
    title: "Player Security",
    description: "Bank-grade encryption protects your data and transactions at all times.",
    backContent: "256-bit SSL encryption and secure servers keep you protected.",
  },
  {
    icon: Video,
    title: "Full CCTV Surveillance",
    description: "24/7 monitoring ensures a safe and secure gaming environment.",
    backContent: "Real-time surveillance for complete transparency and trust.",
  },
];

const FeaturesSection = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="features" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-casino-dark via-background to-casino-dark" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gold-text">Why Choose</span>{" "}
            <span className="text-foreground">RoyalFlush?</span>
          </h2>
          <div className="w-20 h-1 gold-gradient rounded-full mx-auto" />
        </div>

        {/* Casino image banner */}
        <div className={`mb-12 transition-all duration-1000 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative rounded-2xl overflow-hidden h-48 md:h-64">
            <img 
              src="/image3.webp"
              alt="Casino roulette"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`card-flip h-64 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="card-flip-inner relative w-full h-full">
                {/* Front */}
                <div className="card-front absolute inset-0 glass gold-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>

                {/* Back */}
                <div className="card-back absolute inset-0 gold-gradient rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <feature.icon className="w-12 h-12 text-primary-foreground mb-4" />
                  <p className="text-primary-foreground font-semibold">
                    {feature.backContent}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
