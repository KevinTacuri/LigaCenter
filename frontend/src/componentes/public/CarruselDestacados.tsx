import { useEffect, useRef, useState } from 'react';
import type {
  PublicMatch,
  PublicDiscipline,
  PublicCategory,
  PublicCompetitionEvent,
} from '../../servicios/apiPublic';

import { TarjetaPartidoDestacado } from './partidos/TarjetaPartidoDestacado';
import { TarjetaEventoDestacado } from './eventos/TarjetaEventoDestacado';

interface Props {
  matches: PublicMatch[];
  events: PublicCompetitionEvent[];
  disciplines: PublicDiscipline[];
  categories: PublicCategory[];
  loading?: boolean;
}

type Destacado =
  | { type: 'match'; data: PublicMatch }
  | { type: 'event'; data: PublicCompetitionEvent };

export const CarruselDestacados = ({
  matches,
  events,
  disciplines,
  categories,
  loading = false,
}: Props) => {
  const [position, setPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);

  const items: Destacado[] = [
    ...matches.map((data) => ({ type: 'match' as const, data })),
    ...events.map((data) => ({ type: 'event' as const, data })),
  ];

  const duplicatedItems = [...items, ...items];

  useEffect(() => {
    if (!items.length || isPaused) return;

    let lastTimestamp = 0;
    const speed = 0.5;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;

      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setPosition((prev) => {
        const next = prev + (speed * delta) / 16;
        const totalWidth = items.length * 280;

        return next >= totalWidth ? 0 : next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items.length, isPaused]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#11131c] rounded-xl p-4 animate-pulse h-32"
          />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
        <p className="text-slate-400 text-sm">
          No hay competencias destacadas en este momento
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex gap-4"
        style={{
          transform: `translateX(-${position}px)`,
          width: 'max-content',
        }}
      >
        {duplicatedItems.map((item, index) => {
          if (item.type === 'event') {
            return (
              <TarjetaEventoDestacado
                key={`event-${item.data.id}-${index}`}
                evento={item.data}
              />
            );
          }

          const disciplineName =
            item.data.discipline_name ||
            disciplines.find((d) => d.id === item.data.discipline_id)?.name;

          const categoryName =
            item.data.category_name ||
            categories.find((c) => c.id === item.data.category_id)?.name;

          return (
            <TarjetaPartidoDestacado
              key={`match-${item.data.id}-${index}`}
              match={item.data}
              disciplineName={disciplineName}
              categoryName={categoryName}
            />
          );
        })}
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0b10] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0b10] to-transparent pointer-events-none" />
    </div>
  );
};