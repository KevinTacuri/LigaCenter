interface Props {
  status: string;
}

export const InsigniaEstadoEvento = ({ status }: Props) => {
  if (status === 'en_curso') {
    return (
      <span className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">
        EN CURSO
      </span>
    );
  }

  if (status === 'finalizado') {
    return (
      <span className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700/50 text-slate-400">
        FINALIZADO
      </span>
    );
  }

  return (
    <span className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">
      PRÓXIMO
    </span>
  );
};