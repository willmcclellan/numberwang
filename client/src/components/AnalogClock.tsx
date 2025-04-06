import React, { useEffect, useState } from 'react';

interface AnalogClockProps {
  duration: number; // in seconds
  isRunning: boolean;
  onComplete?: () => void;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ duration, isRunning, onComplete }) => {
  const [remainingTime, setRemainingTime] = useState(duration);

  useEffect(() => {
    let intervalId: number;

    if (isRunning && remainingTime > 0) {
      intervalId = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, onComplete, remainingTime]);

  useEffect(() => {
    setRemainingTime(duration);
  }, [duration]);

  // Calculate the correct hand position
  let startAngle, endAngle;
  
  // Map different durations to specific starting positions
  if (duration === 30) {
    startAngle = 0;   // 12 o'clock
    endAngle = 180;   // 6 o'clock
  } else if (duration === 45) {
    startAngle = 270; // 9 o'clock
    endAngle = 180;   // 6 o'clock
  } else if (duration === 60) {
    startAngle = 180; // 6 o'clock
    endAngle = 180;   // 6 o'clock (full rotation ending at same spot)
  } else if (duration === 90) {
    startAngle = 0;   // 12 o'clock
    endAngle = 180;   // 6 o'clock (full rotation + half)
  } else {
    // For any other duration, default to starting at 12 o'clock
    startAngle = 0;
    endAngle = 180;
  }
  
  // Special case handling for durations where start === end
  if (startAngle === endAngle) {
    // For 60s, we want to make a full 360° rotation
    if (duration === 60) {
      // We'll go 360° + back to the starting point
      const progressRatio = (duration - remainingTime) / duration;
      const currentDegrees = (startAngle + progressRatio * 360) % 360;
      
      return renderClock(currentDegrees, remainingTime);
    }
  }
  
  // For 30s and 90s timers, we need special handling too
  if (duration === 30) {
    // For 30s, go from 12 o'clock to 6 o'clock (0° to 180°)
    const progressRatio = (duration - remainingTime) / duration;
    const currentDegrees = startAngle + progressRatio * 180;
    
    return renderClock(currentDegrees, remainingTime);
  }
  
  if (duration === 90) {
    // For 90s, go from 12 o'clock, make a full circle + reach 6 o'clock
    const progressRatio = (duration - remainingTime) / duration;
    const currentDegrees = startAngle + progressRatio * 540; // 360° + 180°
    
    return renderClock(currentDegrees % 360, remainingTime); // Keep it within 0-360
  }
  
  // For 45s and other durations, calculate normally
  const progressRatio = (duration - remainingTime) / duration;
  
  // Calculate angle difference (handle wrapping)
  let angleDiff = endAngle - startAngle;
  if (angleDiff < 0) angleDiff += 360;
  
  const currentDegrees = (startAngle + progressRatio * angleDiff) % 360;
  
  return renderClock(currentDegrees, remainingTime);
  
  // Helper function to render the Countdown TV show style clock
  function renderClock(degrees: number, time: number) {
    return (
      <div className="w-64 h-64 relative flex items-center justify-center">
        {/* Outer circle - dark blue border */}
        <div className="w-full h-full rounded-full border-8 border-blue-900 bg-blue-500 flex items-center justify-center">
          {/* Inner circle - lighter blue fill */}
          <div className="w-5/6 h-5/6 rounded-full bg-white relative flex items-center justify-center">
            {/* SVG for tick marks */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Tick marks */}
              {Array.from({ length: 30 }, (_, i) => {
                const tickAngle = i * 12; // 12 degrees per tick (360 / 30)
                const isHourTick = i % 5 === 0;
                
                // Calculate position using trigonometry
                const radians = (tickAngle - 90) * (Math.PI / 180);
                const outerRadius = 46; // Percentage of the SVG viewBox
                const innerRadius = isHourTick ? 40 : 42; // Shorter for hour ticks
                
                // Start and end coordinates
                const x1 = 50 + outerRadius * Math.cos(radians);
                const y1 = 50 + outerRadius * Math.sin(radians);
                const x2 = 50 + innerRadius * Math.cos(radians);
                const y2 = 50 + innerRadius * Math.sin(radians);
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#666"
                    strokeWidth={isHourTick ? 1.5 : 1}
                  />
                );
              })}
            </svg>
            
            {/* Clock hand */}
            <div 
              className="absolute top-0 left-1/2 w-2 h-1/2 bg-blue-500 origin-bottom transition-transform"
              style={{
                transform: `translateX(-50%) rotate(${degrees}deg)`,
              }}
            />
            
            {/* Central circle */}
            <div className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-blue-500 transform -translate-x-1/2 -translate-y-1/2" />
            
            {/* Timer text */}
            <div className="absolute bottom-8 w-full text-center">
              <div className="text-4xl font-bold text-gray-600 font-mono">
                {time}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default AnalogClock;
