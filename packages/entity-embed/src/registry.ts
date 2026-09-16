import type { EntityEmbedRegistry } from "./types";
import { InlineEntityRefView } from "./views/InlineEntityRefView";
import { ChipEntityRefView } from "./views/ChipEntityRefView";
import { CardEntityRefView } from "./views/CardEntityRefView";

export const defaultEntityEmbedRegistry: EntityEmbedRegistry = {
  inline: InlineEntityRefView,
  chip: ChipEntityRefView,
  card: CardEntityRefView,
};
