import React, { useState, useEffect } from 'react';

interface TiempoEnVivoProps {
  elapsedTime: number | null;
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TiempoEnVivo: React.FC<TiempoEnVivoProps> = ({ 
  elapsedTime, 
  status, 
  size = 'sm' 
}) => {
  const [time, setTime] = useState(elapsedTime || 0);

  useEffect(() => {
    if (status !== 'en_vivo' || elapsedTime === null) {
      setTime(elapsedTime || 0);
      return;
    }

    setTime(elapsedTime);
    
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [elapsedTime, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (status !== 'en_vivo' || elapsedTime === null) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold text-red-400 bg-red-500/10 rounded ${sizeClasses[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {formatTime(time)}
    </span>
  );
};