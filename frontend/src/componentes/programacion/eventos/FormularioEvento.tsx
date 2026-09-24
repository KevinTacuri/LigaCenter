import type {
  CompetitionFormat,
  EventType,
  ParticipationType,
} from '../../../types/CompetitionEvent';

import type { DatosEvento } from '../../../types/CompetitionEvent';


interface Props {
  datosEvento: DatosEvento;

  setDatosEvento: React.Dispatch<
    React.SetStateAction<DatosEvento>
  >;

  disciplinas: any[];
  categorias: any[];
  escenarios: any[];

  onSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
}

export default function FormularioEvento({
  datosEvento,
  setDatosEvento,
  disciplinas,
  categorias,
  escenarios,
  onSubmit,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
      <form
        onSubmit={onSubmit}
        className="space-y-5"
      >
        {/* Disciplina / Categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Disciplina *
            </label>

            <select
              required
              value={datosEvento.discipline_id}
              onChange={(e) =>
                setDatosEvento({
                  ...datosEvento,
                  discipline_id: e.target.value,
                  category_id: '',
                })
              }
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
            >
              <option value="">
                Seleccionar Disciplina
              </option>

              {disciplinas.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Categoría *
            </label>

            <select
              required
              value={datosEvento.category_id}
              onChange={(e) =>
                setDatosEvento({
                  ...datosEvento,
                  category_id: e.target.value,
                })
              }
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
            >
              <option value="">
                Seleccionar Categoría
              </option>

              {categorias
                .filter(
                  (c) =>
                    !datosEvento.discipline_id ||
                    c.championship_discipline
                      ?.discipline_id ===
                      parseInt(
                        datosEvento.discipline_id
                      )
                )
                .map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Nombre / Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Evento *
            </label>

            <input
              type="text"
              required
              placeholder="Ej: 100 metros planos"
              value={datosEvento.name}
              onChange={(e) =>
                setDatosEvento({
                  ...datosEvento,
                  name: e.target.value,
                })
              }
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Tipo *
            </label>

            <select
              required
              value={datosEvento.event_type}
              onChange={(e) =>
                setDatosEvento({
                  ...datosEvento,
                  event_type:
                    e.target.value as EventType,
                })
              }
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
            >
              <option value="carrera">
                Carrera
              </option>

              <option value="salto">
                Salto
              </option>

              <option value="lanzamiento">
                Lanzamiento
              </option>

              <option value="puntaje">
                Puntaje
              </option>
            </select>
          </div>
        </div>

        {/* Participación */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Participación *
          </label>

          <select
            required
            value={datosEvento.participation_type}
            onChange={(e) =>
              setDatosEvento({
                ...datosEvento,
                participation_type:
                  e.target.value as ParticipationType,
              })
            }
            className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
          >
            <option value="individual">
              Individual
            </option>

            <option value="team">
              Por equipos
            </option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Formato de competencia *
          </label>

          <select
            value={datosEvento.competition_format}
            onChange={(e) =>
              setDatosEvento((prev) => ({
                ...prev,
                competition_format:
                  e.target.value as CompetitionFormat,
              }))
            }
            className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer"
          >
            <option value="single_final">
              Final directa
            </option>

            <option value="qualifying_final">
              Clasificatoria + Final
            </option>

            <option value="qualifying_semifinal_final">
              Clasificatoria + Semifinal + Final
            </option>

            <option value="custom">
              Personalizado
            </option>
          </select>
        </div>

        {/* Fecha / Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Fecha *
            </label>

            <input
              type="date"
              required
              value={datosEvento.date}
              onChange={(e) =>
                setDatosEvento({
                  ...datosEvento,
                  date: e.target.value,
                })
              }
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Hora
            </label>

            <input
              type="time"
              value={datosEvento.start_time}
              onChange={(e) =>
                setDatosEvento({
                  ...datosEvento,
                  start_time: e.target.value,
                })
              }
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
            />
          </div>
        </div>

        {/* Escenario */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Escenario
          </label>

          <select
            value={datosEvento.venue_id}
            onChange={(e) =>
              setDatosEvento({
                ...datosEvento,
                venue_id: e.target.value,
              })
            }
            className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
          >
            <option value="">
              Sin escenario
            </option>

            {escenarios.map((esc) => (
              <option
                key={esc.id}
                value={esc.id}
              >
                {esc.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3 rounded-lg text-sm transition-all cursor-pointer"
        >
          Programar Evento
        </button>
      </form>
    </div>
  );
}