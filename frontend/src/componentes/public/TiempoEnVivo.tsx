import React, { useState, useEffect } from 'react';

interface TiempoEnVivoProps {
  elapsedTime: number | null;
  status: string;
  timerStatus?: 'stopped' | 'running' | 'paused' | 'finished' | null;
  currentPeriod?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TiempoEnVivo: React.FC<TiempoEnVivoProps> = ({ 
  elapsedTime, 
  status, 
  timerStatus = null,
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

  // Si no está en vivo, no hay tiempo o está detenido/finalizado, no mostrar nada
  if (status !== 'en_vivo' || elapsedTime === null || timerStatus === 'stopped' || timerStatus === 'finished') {
    return null;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  // Ahora TypeScript sabe que timerStatus solo puede ser 'running' o 'paused' o null
  // Pero como ya verificamos que no es null, solo puede ser 'running' o 'paused'
  const getLabel = () => {
    if (timerStatus === 'paused') {
      return 'PAUSADO';
    }
    // Si no está pausado, está corriendo
    return `P${currentPeriod}`;
  };

  const getColorClass = () => {
    if (timerStatus === 'paused') {
      return 'text-amber-400 bg-amber-500/10';
    }
    // Si no está pausado, está corriendo
    return 'text-red-400 bg-red-500/10';
  };

  const getDotClass = () => {
    if (timerStatus === 'paused') {
      return 'bg-amber-500';
    }
    // Si no está pausado, está corriendo
    return 'bg-red-500 animate-pulse';
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold rounded ${getColorClass()} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotClass()}`} />
      <span className="text-[9px] opacity-70 tracking-wider mr-0.5">{getLabel()}</span>
      {formatTime(time)}
    </span>
  );
};