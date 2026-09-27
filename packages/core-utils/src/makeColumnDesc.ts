import { ColumnDesc } from "@graviola/edb-core-types";

const index2letter = (index: number): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const mod = index % alphabet.length;
  const rest = (index - mod) / alphabet.length;
  const letter = alphabet[mod];
  return rest > 0 ? index2letter(rest) + letter : letter;
};

export const makeColumnDesc: <T>(cells: T[]) => ColumnDesc<T>[] = (cells) =>
  cells.map((value, index) => ({
    index,
    value,
    letter: index2letter(index),
  }));
