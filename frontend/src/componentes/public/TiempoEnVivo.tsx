import React, { useState, useEffect } from 'react';

interface TiempoEnVivoProps {
  elapsedTime: number | null;
  status: string;
  timerStatus?: string; // 'running', 'paused', 'stopped'
  currentPeriod?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TiempoEnVivo: React.FC<TiempoEnVivoProps> = ({ 
  elapsedTime, 
  status, 
  timerStatus = 'stopped',
  currentPeriod = 1,
  size = 'sm' 
}) => {
  const [time, setTime] = useState(elapsedTime || 0);

  useEffect(() => {
    setTime(elapsedTime || 0);
  }, [elapsedTime]);

  useEffect(() => {
    if (status !== 'en_vivo' || elapsedTime === null || timerStatus !== 'running') {
      return;
    }
    
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, timerStatus, elapsedTime]);

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

  const getLabel = () => {
    if (timerStatus === 'paused') {
      return 'PAUSADO';
    }
    if (timerStatus === 'stopped') {
      return 'DETENIDO';
    }
    return `P${currentPeriod}`;
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold rounded ${
      timerStatus === 'paused' 
        ? 'text-amber-400 bg-amber-500/10' 
        : 'text-red-400 bg-red-500/10'
    } ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        timerStatus === 'running' 
          ? 'bg-red-500 animate-pulse' 
          : 'bg-amber-500 animate-pulse'
      }`} />
      <span className="text-[9px] opacity-70 tracking-wider mr-0.5">{getLabel()}</span>
      {formatTime(time)}
    </span>
  );
};