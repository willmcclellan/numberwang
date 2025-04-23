const CountdownLogo = ({ className = '' }: { className?: string }) => {
  const letters = 'NUMBERWANG'.split('');

  const handleClick = () => {
    const path = window.location.pathname;
    const urlGroup = path.split('/')[1];
    if (urlGroup) {
      window.location.href = `/${urlGroup}`;
    } else {
      window.location.href = '/';
    }
  }
  
  return (
    <div onClick={handleClick} className={`flex gap-1 max-w-full px-4 ${className}`}>
      {letters.map((letter, index) => (
        <div
          key={index}
          className="w-10 h-10 bg-blue-600 flex items-center justify-center transform hover:rotate-3 transition-transform"
          style={{
            fontFamily: "'Century Gothic', 'Futura', sans-serif",
            animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
          }}
        >
          <span className="text-white font-bold text-2xl">{letter}</span>
        </div>
      ))}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CountdownLogo;
