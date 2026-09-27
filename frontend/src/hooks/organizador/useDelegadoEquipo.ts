import { useEffect, useState } from 'react';
import { serviciosCampeonatos } from '../../servicios/api';

interface UseDelegadoEquipoParams {
  campeonatoId: number | null;
  usuarioId: number | undefined;
}

export function useDelegadoEquipo({ campeonatoId, usuarioId }: UseDelegadoEquipoParams) {
  const [delegadoTeamId, setDelegadoTeamId] = useState<number | null>(null);
  const [championshipSettings, setChampionshipSettings] = useState<any>({});
  const [prorrogaFecha, setProrrogaFecha] = useState('');
  const [prorrogaMotivo, setProrrogaMotivo] = useState('');
  const [enviandoProrroga, setEnviandoProrroga] = useState(false);
  const [mostrarFormProrroga, setMostrarFormProrroga] = useState(false);

  const cargarRelacionDelegado = async () => {
    if (!campeonatoId) return;
    try {
      const resCamp = await serviciosCampeonatos.obtenerCampeonato(campeonatoId);
      if (resCamp.success && resCamp.data) {
        setChampionshipSettings(resCamp.data.settings || {});
      }
      const resUsers = await serviciosCampeonatos.obtenerUsuariosCampeonato(campeonatoId);
      if (resUsers.success && usuarioId) {
        const miRel = resUsers.data.find((cu: any) => cu.user_id === usuarioId);
        if (miRel && miRel.role === 'team_delegate' && miRel.team_id) {
          setDelegadoTeamId(miRel.team_id);
          return miRel.team_id as number;
        }
      }
    } catch (err) {
      console.error('Error al cargar la relación del delegado o settings:', err);
    }
    return null;
  };

  const limiteStr =
    delegadoTeamId && championshipSettings?.roster_deadlines?.[`team_${delegadoTeamId}`];
  const limiteDate = limiteStr ? new Date(limiteStr) : null;
  const isDeadlineExpired = limiteDate ? new Date() > limiteDate : false;

  const prorrogaPendiente = (championshipSettings?.extension_requests || []).some(
    (r: any) => r.team_id === delegadoTeamId && r.status === 'pendiente'
  );

  const enviarSolicitudProrroga = async (
    e: React.FormEvent,
    nombreCampeonato: string
  ) => {
    e.preventDefault();
    if (!campeonatoId || !delegadoTeamId || !prorrogaFecha || !prorrogaMotivo.trim()) return false;

    setEnviandoProrroga(true);
    try {
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const newRequest = {
        id: nowTimestamp,
        team_id: delegadoTeamId,
        requested_deadline: new Date(prorrogaFecha).toISOString(),
        reason: prorrogaMotivo.trim(),
        status: 'pendiente',
      };

      const updatedSettings = {
        ...championshipSettings,
        extension_requests: [...(championshipSettings.extension_requests || []), newRequest],
      };

      const res = await serviciosCampeonatos.actualizarCampeonato(campeonatoId, {
        name: nombreCampeonato,
        settings: updatedSettings,
      });

      if (res.success) {
        setChampionshipSettings(updatedSettings);
        setProrrogaFecha('');
        setProrrogaMotivo('');
        setMostrarFormProrroga(false);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setEnviandoProrroga(false);
    }
  };

  return {
    delegadoTeamId,
    setDelegadoTeamId,
    championshipSettings,
    cargarRelacionDelegado,
    limiteDate,
    isDeadlineExpired,
    prorrogaPendiente,
    prorrogaFecha,
    setProrrogaFecha,
    prorrogaMotivo,
    setProrrogaMotivo,
    enviandoProrroga,
    mostrarFormProrroga,
    setMostrarFormProrroga,
    enviarSolicitudProrroga,
  };
}