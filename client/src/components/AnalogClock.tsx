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
  }, [isRunning, onComplete]);

  useEffect(() => {
    setRemainingTime(duration);
  }, [duration]);

  const percentage = (remainingTime / duration) * 100;
  const degrees = (360 * percentage) / 100;

  return (
    <div className="w-32 h-32 relative">
      <div className="w-full h-full rounded-full border-4 border-gray-200">
        <div
          className="absolute top-0 left-1/2 w-1 h-1/2 bg-blue-600 origin-bottom transition-transform"
          style={{
            transform: `translateX(-50%) rotate(${degrees}deg)`,
          }}
        />
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-blue-600 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-800">
        {remainingTime}
      </div>
    </div>
  );
};

export default AnalogClock;