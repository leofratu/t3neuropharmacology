# Neuropharm Research

Neuropharm Research is a local-first neuropharmacology workspace for receptor
exploration, compound profiling, stack checking, database-grounded estimates,
scientific diagrams, standardized graph panels, and LaTeX-ready reports.

The project started from the T3 Code agent UI/runtime, but the product direction
is now a pharmacology research cockpit. The remaining orchestration
infrastructure runs model sessions and local tools; the user-facing workflows
focus on compounds, receptors, evidence, mechanisms, uncertainty, risks, and
research artifacts.

## What it does

- Builds compound profiles with target hypotheses, receptor/transporter rows,
  PK/PD prompts, risks, citations, diagrams, and graph specs.
- Explores receptors and pathways such as CHRM1/M1, sigma-1/SIGMAR1, DAT, NET,
  cholinergic systems, catecholamine transporters, glutamate targets, H3,
  alpha2A, orexin, PDE, and other cognition-adjacent targets.
- Compares compounds such as AF710B/ANAVEX 3-71 and methylphenidate as
  mechanism networks instead of one-dimensional "enhancement" scores.
- Installs a built-in basics pack for M1, AF710B aliases, cognitive enhancement
  target maps, niche targets, task-domain scoring, and diagram syntax.
- Searches local evidence notes and local/cached receptor database rows before
  relying on model extrapolation.
- Emits renderable `neuropharm-graph` JSON and Mermaid flowcharts in chat.
- Produces a local XLSX tracker for compounds, targets, interactions, evidence
  claims, graph specs, risk flags, tasks, and sources.

## Local database design

The app supports a local receptor database under the default 1.5 GB cap. The
manifest is intentionally focused on pharmacology rows that can be searched and
used for graph grounding:

- IUPHAR/BPS Guide to Pharmacology interactions TSV.
- IUPHAR ligand, target/family, and physicochemical TSV references.
- BindingDB all-measurements TSV archive.
- BindingDB ChEMBL, PubChem, patent, article, assay, PDSP Ki, and identifier
  mapping TSV archives.

Large multi-GB archives such as ChEMBL SQLite and BindingDB all-2D/all-3D SDF
files are not part of the default local download set.

Downloaded local database files live outside the repo under:

```text
~/.t3/dev/neuropharm/databases
```

SQLite app state lives under the configured T3 state directory. The repository
stores source code, migrations, contracts, tests, prompt policy, and the tracker
template/artifact, not the downloaded public database archives.

## Graph and diagram artifacts

The chat renderer recognizes structured neuropharmacology graph blocks:

```neuropharm-graph
{"kind":"target_network","title":"AF710B local target map","data":[{"label":"M1 muscarinic acetylcholine receptor","value":62,"group":"AF710B","unit":"inferred"}],"notes":["Values are evidence-weighted graph scores, not clinical effect sizes."]}
```

Supported graph kinds include:

- `target_network`
- `receptor_selectivity_radar`
- `interaction_risk_heatmap`
- `task_domain_matrix`
- `pk_timeline`
- `dose_response`
- `effect_size_forest`
- `inverted_u_curve`
- `molecule_property_card`
- `similarity_map`
- `admet_radar`

Mermaid diagrams should use simple `flowchart LR` or `flowchart TD` syntax so
they render reliably in chat.

## Research posture

This is a research and analysis tool. It can discuss evidence, uncertainty,
mechanistic extrapolation, literature ranges, protocol context, receptor
pharmacology, and risk flags. It must not present personalized diagnosis,
treatment, prescribing, emergency guidance, or individualized medical
instructions.

Claims should be separated by evidence class:

- Human
- Animal
- In-vitro
- In-silico
- Anecdotal
- Low-confidence extrapolation

Unsupported claims should be labeled as assumptions or unknowns. Exact receptor
affinities, PK values, contraindications, or study outcomes should not be
invented when the local database or cited literature does not contain them.

## Repository layout

- `apps/server`: Node/Effect backend, WebSocket RPC, SQLite persistence,
  neuropharm services, database connectors, local database downloader/importer,
  and prompt policy.
- `apps/web`: React/Vite UI, chat rendering, database console, research console,
  graph renderer, and neuropharm workspace panels.
- `apps/desktop`: Desktop shell around the web/server runtime.
- `packages/contracts`: Shared schemas for RPC, IPC, neuropharm records,
  graph specs, local database status, and analysis results.
- `output/neuropharm-tracker`: Local XLSX research tracker artifact.
- `repo_plan`: Repository Planning Graph run artifacts for this conversion.

## Development

Install dependencies:

```bash
bun install .
```

Run local development:

```bash
bun run dev
```

Run the core verification gates:

```bash
bun fmt
bun lint
bun typecheck
bun run test
```

Targeted neuropharm checks:

```bash
bun run --filter t3 test src/neuropharm/NeuropharmService.test.ts src/neuropharm/NeuropharmPromptPolicy.test.ts
bun run --filter @t3tools/contracts test src/neuropharm.test.ts
bun run --filter @t3tools/web test:browser src/components/ChatMarkdown.browser.tsx
```

Do not use `bun test`; use `bun run test`.
