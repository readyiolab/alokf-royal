const FloatingChips = () => {
  const chips = [
    { color: 'from-primary to-gold-dark', delay: '0.3s', position: 'top-40 right-32', size: 'w-12 h-12' },
    { color: 'from-red-600 to-red-800', delay: '1.2s', position: 'bottom-48 left-32', size: 'w-10 h-10' },
    { color: 'from-primary to-gold-dark', delay: '2.1s', position: 'top-60 left-40', size: 'w-8 h-8' },
    { color: 'from-emerald-500 to-emerald-700', delay: '0.8s', position: 'bottom-36 right-40', size: 'w-10 h-10' },
    { color: 'from-primary to-gold-dark', delay: '1.8s', position: 'top-1/3 right-16', size: 'w-14 h-14' },
  ];

  return (
    <>
      {chips.map((chip, index) => (
        <div
          key={index}
          className={`absolute ${chip.position} ${chip.size} hidden lg:flex animate-float-slow opacity-30 hover:opacity-50 transition-opacity duration-500`}
          style={{ animationDelay: chip.delay }}
        >
          <div className={`w-full h-full rounded-full bg-gradient-to-br ${chip.color} border-4 border-dashed border-foreground/20 shadow-lg flex items-center justify-center`}>
            <div className="w-1/2 h-1/2 rounded-full bg-foreground/10" />
          </div>
        </div>
      ))}
    </>
  );
};

export default FloatingChips;
