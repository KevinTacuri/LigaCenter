import type {
  PublicMatch,
  PublicDiscipline,
  PublicChampionship,
  PublicCategory,
  PublicCompetitionEvent,
} from '../../servicios/apiPublic';

export interface CategoryGroup {
  id: string;
  name: string;
  discipline_id: number;
  matches: PublicMatch[];
  events: PublicCompetitionEvent[];
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
}

export interface DisciplineGroup {
  id: number;
  name: string;
  categories: Record<string, CategoryGroup>;
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
}

export interface ExpandedState {
  [championshipId: number]: {
    expanded: boolean;
    disciplines: Record<number, DisciplineGroup>;
  };
}

interface Params {
  matches: PublicMatch[];
  events: PublicCompetitionEvent[];
  championships: PublicChampionship[];
  disciplines: PublicDiscipline[];
  categories: PublicCategory[];
}

export const construirEstructuraPublica = ({
  matches,
  events,
  championships,
  disciplines,
  categories,
}: Params): ExpandedState => {
  const state: ExpandedState = {};

  championships.forEach((champ) => {
    const champMatches = matches.filter(
      (m) => m.championship?.id === champ.id
    );

    const champEvents = events.filter(
      (e) => e.championship_id === champ.id
    );

    if (!champMatches.length && !champEvents.length) return;

    state[champ.id] = {
      expanded: false,
      disciplines: {},
    };

    const disciplineIds = new Set<number>([
      ...champMatches.map((m) => m.discipline_id),
      ...champEvents.map((e) => e.discipline_id),
    ]);

    disciplineIds.forEach((disciplineId) => {
      const disciplineName =
        champMatches.find((m) => m.discipline_id === disciplineId)
          ?.discipline_name ||
        champEvents.find((e) => e.discipline_id === disciplineId)
          ?.discipline_name ||
        disciplines.find((d) => d.id === disciplineId)?.name ||
        `Disciplina ${disciplineId}`;

      const disciplineMatches = champMatches.filter(
        (m) => m.discipline_id === disciplineId
      );

      const disciplineEvents = champEvents.filter(
        (e) => e.discipline_id === disciplineId
      );

      const categoryIds = new Set<number>([
        ...disciplineMatches
          .map((m) => m.category_id)
          .filter(Boolean),
        ...disciplineEvents
          .map((e) => e.category_id)
          .filter(Boolean),
      ]);

      const categoriesObj: Record<string, CategoryGroup> = {};

      categoryIds.forEach((categoryId) => {
        const catId = `cat-${disciplineId}-${categoryId}`;

        const categoryName =
          disciplineMatches.find((m) => m.category_id === categoryId)
            ?.category_name ||
          disciplineEvents.find((e) => e.category_id === categoryId)
            ?.category_name ||
          categories.find((c) => c.id === categoryId)?.name ||
          `Categoría ${categoryId}`;

        categoriesObj[catId] = {
          id: catId,
          name: categoryName,
          discipline_id: disciplineId,
          matches: disciplineMatches.filter(
            (m) => m.category_id === categoryId
          ),
          events: disciplineEvents.filter(
            (e) => e.category_id === categoryId
          ),
            loaded: true,
            loading: false,
          expanded: false,
        };
      });

      state[champ.id].disciplines[disciplineId] = {
        id: disciplineId,
        name: disciplineName,
        categories: categoriesObj,
        expanded: false,
        loaded: true,
        loading: false,
      };
    });
  });

  return state;
};