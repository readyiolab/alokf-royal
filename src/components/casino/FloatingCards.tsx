const FloatingCards = () => {
  const cards = [
    { suit: '♠', value: 'A', color: 'text-foreground', delay: '0s', position: 'top-20 left-10', rotation: '-15deg' },
    { suit: '♥', value: 'K', color: 'text-red-500', delay: '1s', position: 'top-32 right-20', rotation: '20deg' },
    { suit: '♦', value: 'Q', color: 'text-red-500', delay: '2s', position: 'bottom-40 left-20', rotation: '-10deg' },
    { suit: '♣', value: 'J', color: 'text-foreground', delay: '0.5s', position: 'bottom-32 right-10', rotation: '15deg' },
    { suit: '♠', value: '10', color: 'text-foreground', delay: '1.5s', position: 'top-1/2 left-5', rotation: '-25deg' },
  ];

  return (
    <>
      {cards.map((card, index) => (
        <div
          key={index}
          className={`absolute ${card.position} hidden lg:block animate-float opacity-20 hover:opacity-40 transition-opacity duration-500`}
          style={{ 
            animationDelay: card.delay,
            transform: `rotate(${card.rotation})`,
          }}
        >
          <div className="w-16 h-24 bg-gradient-to-br from-card to-muted rounded-lg border border-border/30 flex flex-col items-center justify-center shadow-xl">
            <span className={`text-xl font-bold ${card.color}`}>{card.value}</span>
            <span className={`text-2xl ${card.color}`}>{card.suit}</span>
          </div>
        </div>
      ))}
    </>
  );
};

export default FloatingCards;
