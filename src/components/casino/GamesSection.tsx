import { useInView } from "@/hooks/useInView";
import { Spade, Heart, Diamond, Club } from "lucide-react";

const GamesSection = () => {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  const games = [
    {
      title: "PLO 4-Card",
      description: "Classic Pot Limit Omaha for fast-paced action.",
      icon: Spade
    },
    {
      title: "PLO 5-Card",
      description: "One more card. Five times the thrill.",
      icon: Heart
    },
    {
      title: "Texas Hold'em",
      description: "Timeless strategy, global favourite.",
      icon: Diamond
    },
    {
      title: "ROE (Round of Each)",
      description: "Alternating Hold'em and PLO4 in one seamless format.",
      icon: Club
    }
  ];

  return (
    <section id="games" className="py-20 relative overflow-hidden min-h-[600px]" ref={ref}>
      {/* Background image with overlay */}
      

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image on left - empty space for visual balance */}
          <div className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <img src="/image4.jpeg" alt="people" className="rounded-2xl"/>
          </div>

          {/* Content on right side */}
          <div className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="text-left">
              {/* Badge */}
              <span className="inline-block text-xs font-medium text-amber-400 bg-amber-400/10 px-4 py-2 rounded-full mb-6 border border-amber-400/20">
                Games Offered
              </span>

              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Play your variant. <br />
                <span className="text-amber-400">Own your edge.</span>
              </h2>

              {/* Games list */}
              <div className="space-y-6 mt-8">
                {games.map((game, index) => {
                  const Icon = game.icon;
                  return (
                    <div 
                      key={index}
                      className="group  p-2 rounded-lg transition-all duration-300 "
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-amber-400 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                            {game.title}
                          </h3>
                          <p className="text-gray-300 leading-relaxed">
                            {game.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;