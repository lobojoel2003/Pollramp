# Changelog

All notable changes to Pollramp are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Checklist data files are versioned
separately (see `checklists/README.md`).

## [Unreleased]

## [1.0.0] - 2026-11-21

The first release of Pollramp: an open, offline-first survey tool for polling place accessibility.

### Surveying

- Route-ordered survey: parking, passenger drop-off, the route to the entrance, curb ramps, ramps,
  the accessible entrance, the interior route and the voting area. Sections that don't apply at a
  site are skipped through gate questions and conditional items.
- One measurable question per screen with a diagram of what to measure (40 SVG diagrams), the
  standard it must meet, and large inputs for measurements, counts, yes/no and multiple choice.
- Tape-measure input (`32 1/2`, `8' 2"`, fraction buttons) and a rise/run calculator for slopes.
- Computed thresholds: accessible and van-accessible spaces required by ADA Table 208.2 and §208.2.4.
- Photos (resized on the device) and notes on every item, and “does not apply” for any question.
- Live verdict on every answer: a failed item shows whether it can be fixed on election day with
  equipment, with a poll-worker procedure, or not at all.
- Sized election-day kit: threshold ramps up to 2 inches, and portable ramps at 1:12 above that
  (with a handrail note over 6 inches). Shortfalls become cones and signs per missing parking space.
  The kit is written as a sentence, for example “Bring one 2-inch threshold ramp and one
  ‘Accessible entrance’ sign with arrow.”
- Review and submit, with a printable survey report.

### Office tools

- Dashboard with status tiles, a MapLibre map of every site, search and status filters.
- Site status: accessible, accessible with election-day fixes, barriers remain, in progress,
  not surveyed. Status uses symbols as well as colour.
- Office-wide election-day kit totals and per-site packing lists, printable and as CSV.
- CSV import of polling places with column-name detection and duplicate skipping.
- CSV exports of results by site and of every measurement.
- Accounts with admin, surveyor and viewer roles, first-run setup, and an audit log.

### Voters

- Plain-language, server-rendered voter page per published polling place: the accessible entrance,
  parking, available features, what will be set up on election day, and how to get help.
- A searchable directory of published polling places.
- Open data: published sites as GeoJSON at `/api/public/sites.geojson`.

### Offline and sync

- Installable PWA; the service worker precaches the app shell, code, fonts, checklists and a
  county-boundary basemap for each build.
- All data lives in IndexedDB on the device and syncs in the background, with last-write-wins
  conflict handling. The server re-evaluates every survey on sync.

### Checklists (CC0)

- `doj-base@1.0.0`: the federal base checklist (2010 ADA Standards, DOJ checklist structure),
  80 items with citations, fixes and a 23-item kit catalog.
- `us-ca@1.0.0` (California Building Code 11B), `us-fl@1.0.0` (s. 553.5041, F.S.) and
  `us-va@1.0.0` (curbside voting, Va. Code § 24.2-649) overlays.
- JSON Schemas and `pnpm checklists:validate` (schema validation plus semantic lint).

### Platform

- SvelteKit 3, Svelte 5, TypeScript, PostgreSQL (postgres.js) and MapLibre GL 6.
- Automatic database migrations on start-up, plus `migrate` and `create-user` CLI scripts.
- Docker image (non-root, health check, OCI labels with version and build number) and a
  Docker Compose setup.
- CI: checklist validation, Prettier, ESLint, svelte-check, Vitest, Playwright end-to-end tests
  with axe accessibility checks, and a Docker build with a smoke test. CodeQL and Dependabot.
- CD: `edge` images from `main`; tagged releases publish multi-arch images, release bundles and
  checksums.
- Build metadata (version, build number, commit, build time) in the UI, `/api/health` and image
  labels.

[Unreleased]: https://github.com/lobojoel2003/Pollramp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lobojoel2003/Pollramp/releases/tag/v1.0.0
