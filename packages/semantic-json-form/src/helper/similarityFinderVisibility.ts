/**
 * Whether a form shows the floating toggle for the similarity-finder drawer.
 *
 * The toggle belongs to the form that currently owns the global search path:
 * linked-entity renderers and the root search field call `setPath(formsPath)`
 * on focus. A form without a `formsPath` can never own that path, so it never
 * shows the toggle — the global path starts out `undefined`, and comparing
 * `undefined === undefined` used to show the toggle on every such form.
 *
 * `disableSimilarityFinder` is deliberately not part of this rule: it only
 * disables the inline side-by-side finder panel. Nested linked-entity forms and
 * `EditEntityModal` set it and still rely on the drawer toggle.
 */
export const showsSimilarityFinderToggle = ({
  formsPath,
  globalPath,
}: {
  formsPath?: string;
  globalPath?: string;
}): boolean => formsPath !== undefined && formsPath === globalPath;
