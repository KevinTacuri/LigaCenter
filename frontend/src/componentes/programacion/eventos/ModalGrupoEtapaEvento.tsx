import type {
  Dispatch,
  FormEvent,
  SetStateAction,
} from 'react';

import type {
  Escenario,
} from '../../../servicios/api';

import type {
  DatosGrupoEtapaEvento,
  EventGroupType,
  EventStatus,
  GrupoEtapaEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  abierto: boolean;

  grupoEditando: GrupoEtapaEvento | null;

  datos: DatosGrupoEtapaEvento;

  setDatos: Dispatch<
    SetStateAction<DatosGrupoEtapaEvento>
  >;

  escenarios: Escenario[];

  onCerrar: () => void;

  onSubmit: (e: FormEvent) => void;
}

const ModalGrupoEtapaEvento = ({
  abierto,
  grupoEditando,
  datos,
  setDatos,
  escenarios,
  onCerrar,
  onSubmit,
}: Props) => {
  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {grupoEditando
                ? 'Editar grupo'
                : 'Agregar grupo'}
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Configuración del grupo o serie
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              close
            </span>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Nombre *
            </label>

            <input
              required
              type="text"
              placeholder="Ej: Serie 1, Grupo A"
              value={datos.name}
              onChange={(e) =>
                setDatos((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Tipo *
              </label>

              <select
                value={datos.group_type}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    group_type:
                      e.target.value as EventGroupType,
                  }))
                }
                className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer"
              >
                <option value="series">
                  Serie
                </option>

                <option value="group">
                  Grupo
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Número *
              </label>

              <input
                required
                type="number"
                min="1"
                value={datos.group_number}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    group_number:
                      e.target.value,
                  }))
                }
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Fecha
              </label>

              <input
                type="date"
                value={datos.date}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Hora
              </label>

              <input
                type="time"
                value={datos.start_time}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    start_time:
                      e.target.value,
                  }))
                }
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Escenario
            </label>

            <select
              value={datos.venue_id}
              onChange={(e) =>
                setDatos((prev) => ({
                  ...prev,
                  venue_id: e.target.value,
                }))
              }
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer"
            >
              <option value="">
                Sin escenario
              </option>

              {escenarios.map((escenario) => (
                <option
                  key={escenario.id}
                  value={escenario.id}
                >
                  {escenario.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Estado
            </label>

            <select
              value={datos.status}
              onChange={(e) =>
                setDatos((prev) => ({
                  ...prev,
                  status:
                    e.target.value as EventStatus,
                }))
              }
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer"
            >
              <option value="programado">
                Programado
              </option>

              <option value="en_curso">
                En curso
              </option>

              <option value="finalizado">
                Finalizado
              </option>

              <option value="cancelado">
                Cancelado
              </option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-secondary hover:bg-secondary-container text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              {grupoEditando
                ? 'Guardar cambios'
                : 'Crear grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalGrupoEtapaEvento;