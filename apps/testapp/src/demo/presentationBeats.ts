/**
 * Beat list shared by the presentation hub and the choreography document.
 * Keep titles/cues in sync when editing the live walkthrough.
 */
export type PresentationBeat = {
  id: string;
  title: string;
  duration: string;
  summary: string;
  /** One-line spoken cue for the presenter. */
  spokenCue: string;
  href: string;
};

export const PRESENTATION_BEATS: PresentationBeat[] = [
  {
    id: "frame",
    title: "Frame the problem",
    duration: "~60s",
    summary:
      "Home → garden-fee present hub. Domain purity, calc sidecar, provenance as first-class metadata.",
    spokenCue:
      "We never bake fees into the domain schema — calc and provenance ride beside it.",
    href: "/garden-fee/present",
  },
  {
    id: "table",
    title: "Tabular materializations",
    duration: "~90s",
    summary:
      "Garden list: two allotments, billable / net / gross / VAT columns from the store.",
    spokenCue:
      "The table is store-driven — these numbers were materialized into turtle so SemanticTable stays ordinary.",
    href: "/garden-fee/list/Garden",
  },
  {
    id: "strata",
    title: "Stratification ladder",
    duration: "~90s",
    summary:
      "Show the compiled stratum cards (Plot→Patch→Garden→VAT) before opening a detail.",
    spokenCue:
      "Stratum is not a UI label — it is the dependency order the compiler computed.",
    href: "/garden-fee/list/Garden",
  },
  {
    id: "north-detail",
    title: "Structural computed detail",
    duration: "~2min",
    summary:
      "Allotment North detail: x-calc renderers, currency/area formatting, formula chips.",
    spokenCue:
      "The renderer matched x-calc on the schema — no annual_fee special-case in the tester.",
    href: "/garden-fee/detail/Garden/garden%2F1",
  },
  {
    id: "nested",
    title: "Nested patch & plots",
    duration: "~90s",
    summary:
      "Open the patch entity (named IRI) and show plot dimensions feeding the sum.",
    spokenCue:
      "Aggregation crosses the CBD: plots contribute billable_area, patch sums, garden lifts.",
    href: "/garden-fee/detail/Garden/garden%2F1",
  },
  {
    id: "prov-field",
    title: "Provenance door 1 — field info",
    duration: "~90s",
    summary:
      "Info icon on annual_fee → StatementNode modal via DetailRenderer.",
    spokenCue:
      "Same structural dispatch stack — StatementNode is just another schema shape.",
    href: "/garden-fee/detail/Garden/garden%2F1",
  },
  {
    id: "prov-stmt",
    title: "Provenance door 2 — statement chips",
    duration: "~60s",
    summary:
      "Statements · annual_fee chip → identical modal path, different affordance.",
    spokenCue:
      "Curious users can enter from the sibling __stmt array — not only from the value row.",
    href: "/garden-fee/detail/Garden/garden%2F1",
  },
  {
    id: "prov-meta",
    title: "Provenance door 3 — entity $meta",
    duration: "~60s",
    summary:
      "Entity metadata button → MetaSchema flattened into DetailRenderer.",
    spokenCue:
      "Fact-level and entity-level metadata stay distinct — both are schema-driven.",
    href: "/garden-fee/detail/Garden/garden%2F1",
  },
  {
    id: "south",
    title: "Contrast garden (South)",
    duration: "~60s",
    summary:
      "Allotment South: different rate, VAT 7%, same machinery, different numbers.",
    spokenCue:
      "One profile, many instances — stratification does not care which garden you open.",
    href: "/garden-fee/detail/Garden/garden%2F2",
  },
  {
    id: "debug",
    title: "Internals (optional)",
    duration: "~45s",
    summary:
      "Toggle calc debug / ?calcDebug=1 and show console traces of evaluation + stmt attach.",
    spokenCue:
      "Debug is a KISS localStorage flag — silence it the same way you turned it on.",
    href: "/garden-fee/detail/Garden/garden%2F1?calcDebug=1",
  },
  // —— Part II: edit form / change / empty-form race (start only when asked) ——
  {
    id: "edit-live-vs-form",
    title: "Detail is live; form is materialized",
    duration: "~45s",
    summary:
      "North detail live computed panel vs edit form contract before clicking Bearbeiten.",
    spokenCue:
      "Detail recomputes strata; the form will show a store snapshot with read-only calc fields.",
    href: "/garden-fee/detail/Garden/garden%2F1",
  },
  {
    id: "edit-race",
    title: "Empty-form race on Edit",
    duration: "~90s",
    summary:
      "Bearbeiten may land on an empty form; intermittent when Redux form bucket is cold.",
    spokenCue:
      "Empty controls are the race — JsonForms user events can wipe the load because initial fetch is not gated.",
    href: "/garden-fee/edit/Garden/garden%2F1",
  },
  {
    id: "edit-reload",
    title: "Reload recovery",
    duration: "~45s",
    summary:
      "Toolbar reload → Neuladen fills the form; contrast with ungated initial load.",
    spokenCue:
      "Reload sets isReloading so user-originated overwrites are blocked while fetch runs.",
    href: "/garden-fee/edit/Garden/garden%2F1",
  },
  {
    id: "edit-readonly-calcs",
    title: "Read-only calculated fields",
    duration: "~60s",
    summary:
      "total_billable / annual_fee / annual_fee_gross visible as disabled spinbuttons via x-calc readOnly.",
    spokenCue:
      "Calcs are not hidden — annotateCalcSchema marks them readOnly for JSON Forms.",
    href: "/garden-fee/edit/Garden/garden%2F1",
  },
  {
    id: "edit-change-no-live",
    title: "Change VAT — live form update",
    duration: "~90s",
    summary:
      "Edit vat_rate; gross updates live via policy-filtered formula-runtime. Save strips x-calc.",
    spokenCue:
      "Changing VAT moves gross here too — live overlay, never persisted.",
    href: "/garden-fee/edit/Garden/garden%2F1",
  },
];
