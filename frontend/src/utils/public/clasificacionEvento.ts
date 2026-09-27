import type { PublicCompetitionResult } from '../../servicios/apiPublic';

interface Params {
  result: PublicCompetitionResult;
  qualificationMethod?: string | null;
  qualifiersPerGroup?: number | null;
}

export const participanteClasifica = ({
  result,
  qualificationMethod,
  qualifiersPerGroup,
}: Params) => {
  if (
    qualificationMethod !== 'best_per_group' ||
    !qualifiersPerGroup ||
    !result.position
  ) {
    return false;
  }

  return result.position <= qualifiersPerGroup;
};