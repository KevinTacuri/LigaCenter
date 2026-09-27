import { useParams } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { CabeceraEventoPublico } from '../../componentes/public/eventos/CabeceraEventoPublico';
import { EtapasEventoPublico } from '../../componentes/public/eventos/EtapasEventoPublico';
import { useDetalleEventoPublico } from '../../hooks/public/useDetalleEventoPublico';

export const DetalleEventoPublico = () => {

  const { id } = useParams();
  const { evento, loading} =
    useDetalleEventoPublico(Number(id));

  if (loading) {
    return (
      <LayoutPublico>
        <div className="py-10 text-center text-sm text-slate-500">
          Cargando evento...
        </div>
      </LayoutPublico>
    );
  }

  if (!evento) {
    return (
      <LayoutPublico>
        <div className="py-10 text-center text-sm text-slate-500">
          Evento no encontrado
        </div>
      </LayoutPublico>
    );
  }

  return (
    <LayoutPublico>
      <div className="space-y-6">
        <CabeceraEventoPublico evento={evento} />
        <EtapasEventoPublico evento={evento} />
      </div>
    </LayoutPublico>
  );
};