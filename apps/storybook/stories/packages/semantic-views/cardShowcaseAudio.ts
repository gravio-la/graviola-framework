import { storybookPublicUrl } from "../../_shared/storybookPublicUrl";

/** Served from `apps/storybook/public/fixtures/fuga.ogg`. */
export const FUGA_RECORDING_URL = storybookPublicUrl("/fixtures/fuga.ogg");

/**
 * Haussmann portrait (1746/1748), Bach holding the BWV 1076 canon manuscript.
 * Public domain — Wikimedia Commons, CC PD Mark 1.0.
 * @see https://commons.wikimedia.org/wiki/File:Johann_Sebastian_Bach.jpg
 */
export const BACH_PORTRAIT_HAUSSMANN_URL = storybookPublicUrl(
  "/fixtures/bach-portrait.jpg",
);

/** Instrument photos served from `apps/storybook/public/fixtures/` (from testapp COMMONS_SOURCES). */
export const WIKIMEDIA = {
  violin: storybookPublicUrl("/fixtures/violin.jpg"),
  acousticGuitar: storybookPublicUrl("/fixtures/acoustic-guitar.jpg"),
  clarinet: storybookPublicUrl("/fixtures/clarinet.jpg"),
  studentViolin: storybookPublicUrl("/fixtures/student-violin.jpg"),
  digitalPiano: storybookPublicUrl("/fixtures/digital-piano.jpg"),
} as const;
