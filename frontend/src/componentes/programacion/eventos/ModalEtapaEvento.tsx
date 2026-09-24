import type {
  Dispatch,
  FormEvent,
  SetStateAction,
} from 'react';

import type {
  DatosEtapaEvento,
  EtapaEvento,
  EventStageType,
  EventStatus,
  QualificationMethod,
} from '../../../types/CompetitionEvent';

interface Props {
  abierto: boolean;

  etapaEditando: EtapaEvento | null;

  datos: DatosEtapaEvento;

  setDatos: Dispatch<
    SetStateAction<DatosEtapaEvento>
  >;

  onCerrar: () => void;

  onSubmit: (e: FormEvent) => void;
}

const ModalEtapaEvento = ({
  abierto,
  etapaEditando,
  datos,
  setDatos,
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
              {etapaEditando
                ? 'Editar etapa'
                : 'Agregar etapa'}
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Configuración de la etapa del evento
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
              placeholder="Ej: Clasificatoria, Semifinal, Final"
              value={datos.name}
              onChange={(e) =>
                setDatos((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Tipo de etapa *
              </label>

              <select
                required
                value={datos.stage_type}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    stage_type:
                      e.target.value as EventStageType,
                  }))
                }
                className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer"
              >
                <option value="qualifying">
                  Clasificatoria
                </option>

                <option value="semifinal">
                  Semifinal
                </option>

                <option value="final">
                  Final
                </option>

                <option value="round">
                  Ronda
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Número de etapa *
              </label>

              <input
                required
                type="number"
                min="1"
                value={datos.stage_number}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    stage_number:
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
                Cantidad que clasifica
              </label>

              <input
                type="number"
                min="1"
                placeholder="Ej: 8"
                value={datos.qualifiers_count}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    qualifiers_count:
                      e.target.value,
                  }))
                }
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Método de clasificación
              </label>

              <select
                value={datos.qualification_method}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    qualification_method:
                      e.target.value as
                        | QualificationMethod
                        | '',
                  }))
                }
                className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer"
              >
                <option value="">
                  Sin método
                </option>

                <option value="best_overall">
                  Mejores generales
                </option>

                <option value="all">
                  Todos
                </option>
              </select>
            </div>
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
              {etapaEditando
                ? 'Guardar cambios'
                : 'Crear etapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEtapaEvento;