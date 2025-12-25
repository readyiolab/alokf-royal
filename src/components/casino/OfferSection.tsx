import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";
import { Gift } from "lucide-react";

const OfferSection = () => {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section id="offer" className="py-20 relative overflow-hidden min-h-[600px]" ref={ref}>
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src="/food.webp" 
          alt="Casino background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className={`max-w-2xl transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Content on left side */}
          <div className="text-left">
            {/* Badge */}
            <span className="inline-block text-xs font-medium text-amber-400 bg-amber-400/10 px-4 py-2 rounded-full mb-6 border border-amber-400/20">
               Check Offer
            </span>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Fun, Food, Fortune & <br />
              <span className="text-amber-400">A Fantastic Offer!</span>
            </h2>

            <p className="text-lg text-gray-300 mb-4 leading-relaxed">
              The perfect destination for fun, food and fortune comes with an exclusive deal. Get ahead in the game and win big!
            </p>
            <p className="text-lg text-gray-300 mb-4 leading-relaxed">
            Buy in for 5K and receive an extra 2.5K bonus chips.
            </p>
            <p className="text-lg text-gray-300 mb-4 leading-relaxed">
            To secure this deal, be one of the first 9 to arrive before 12:30pm! A great way to get ahead in the game, and win big too. All on The House!
            </p>

            

            
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferSection;
