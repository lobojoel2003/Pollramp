<div align="center">

<img src="docs/images/logo.svg" alt="" width="88" height="88" />

# Pollramp

**Polling place accessibility surveys that work in the parking lot, not just the office.**

Walk the route from the parking lot to the voting room, measure one thing per screen, and get an
election-day fix and kit list for every barrier. Then publish a plain-language accessibility page
for each polling place.

[![CI](https://github.com/lobojoel2003/Pollramp/actions/workflows/ci.yml/badge.svg)](https://github.com/lobojoel2003/Pollramp/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/lobojoel2003/Pollramp?sort=semver)](https://github.com/lobojoel2003/Pollramp/releases)
[![Docker image](https://img.shields.io/badge/ghcr.io-pollramp-0b5e55?logo=docker&logoColor=white)](https://github.com/lobojoel2003/Pollramp/pkgs/container/pollramp)
[![App license: AGPL-3.0](https://img.shields.io/badge/app-AGPL--3.0-blue)](LICENSE)
[![Checklist data: CC0-1.0](https://img.shields.io/badge/checklists-CC0--1.0-lightgrey)](checklists/LICENSE)
[![WCAG 2.1 AA tested](https://img.shields.io/badge/WCAG%202.1%20AA-tested%20with%20axe-0b5e55)](#accessibility)

<br />

<img src="docs/images/survey-threshold.png" alt="Survey screen on a phone: a diagram of a door threshold, the question “How high is the threshold at the entrance door?”, and a large input showing 1 3/4 inches" width="260" />
&nbsp;
<img src="docs/images/survey-threshold-fix.png" alt="The same screen after answering: “Does not meet the standard · Bring equipment. Bring one 2-inch threshold ramp and one ‘Accessible entrance’ sign with arrow. Added to the election-day kit.”" width="260" />
&nbsp;
<img src="docs/images/voter-features.png" alt="Voter-facing page on a phone listing entrance features: entrance hours available, door width available, threshold ramp on election day" width="260" />

</div>

---

## Contents

- [Why Pollramp](#why-pollramp)
- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Checklists: versioned data, federal base plus state overlays](#checklists)
- [How it works](#how-it-works)
- [Accessibility](#accessibility)
- [Development](#development)
- [Versioning, builds and releases](#versioning-builds-and-releases)
- [Security and privacy](#security-and-privacy)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Why Pollramp

Under the Americans with Disabilities Act, every polling place must be usable by voters with
disabilities on election day: parking, the route to the door, door widths, ramps, and the voting
area. Election offices survey thousands of sites, often churches and schools that change between
elections. Surveyors walk each site with a tape measure, a door-pressure gauge and a long PDF
checklist, and the results end up in binders or spreadsheets.

- The U.S. Department of Justice's
  [ADA Checklist for Polling Places](https://www.justice.gov/opa/blog/justice-department-issues-updated-guidance-americans-disabilities-act-checklist-polling)
  cites a GAO finding that only **27% of polling places were accessible** in the 2008 presidential
  election, and describes the temporary fixes officials can make, such as portable ramps and propped
  doors.
- States publish their own versions:
  [Virginia ELECT-310C](https://elections.es.virginia.gov/media/formswarehouse/accessibility/ELECT-310C-Accessibility-Checklist.pdf),
  [Florida](https://soe.dos.state.fl.us/pdf/DE-Guide-0014.Polling-Place-Accessibility%20.pdf) and
  [California](https://elections.cdn.sos.ca.gov/polling-place-accessibility/checklist/appendix-b-complete.pdf).
  Disability rights groups run their own surveys too
  ([Disability Rights Texas](https://disabilityrightstx.org/en/handout/polling-place-accessibility-survey-short-version/)).
- The closest existing tool is
  [San Joaquin County's](https://caceo58.org/san-joaquin-county-survey-tool) fillable 2010 PDF for
  Windows tablets that exports to Excel. Iowa built a state-only app in 2017. There was no open,
  current, multi-state survey tool.

Pollramp is that tool: free software, offline-first, with the checklists published as open data.

## What it does

|                                           |                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🚶 **Walk the route in order**            | Parking → drop-off → (curbside voting) → route → curb ramps → ramps → entrance → interior → voting area. Sections that don't apply (no ramp, no parking) are skipped automatically.                                                                                                                           |
| 📐 **One measurable question per screen** | Each screen has a diagram of exactly what to measure, the standard it must meet, and a big input that understands tape-measure fractions (`32 1/2`, `8' 2"`) and rise/run for slopes. Thresholds that depend on earlier answers (such as accessible spaces required by ADA Table 208.2) are computed for you. |
| 📷 **Photos and notes on every item**     | Camera photos are resized on the device, stored offline, and synced later.                                                                                                                                                                                                                                    |
| 🧰 **Every failure suggests a fix**       | Each failed item says whether it can be fixed on election day with equipment, with a poll-worker procedure, or not at all, and adds sized equipment to the kit list: _“Bring one 2-inch threshold ramp and one ‘Accessible entrance’ sign.”_ A 4-inch step becomes a 4-foot portable ramp at 1:12.            |
| 🗺️ **Office map of every site**           | Status at a glance: accessible, accessible with election-day fixes, barriers remain, in progress, not surveyed. The status is shown with a symbol as well as colour. Works with any MapLibre style, and falls back to a built-in county basemap offline.                                                      |
| 📦 **Election-day kit totals**            | Office-wide totals for procurement and a per-site packing checklist, printable or as CSV.                                                                                                                                                                                                                     |
| 🗳️ **Voter-facing accessibility pages**   | Publish a plain-language, server-rendered page per polling place (no JavaScript needed): the accessible entrance, parking, what will be set up on election day, and who to call. Published sites are also open data as GeoJSON.                                                                               |
| 📴 **Works offline**                      | An installable PWA. Surveys, photos and sites live in IndexedDB on the device and sync to the server with last-write-wins conflict handling when a connection returns.                                                                                                                                        |
| 📋 **Checklists as versioned data**       | The DOJ / 2010 ADA Standards base checklist plus California, Florida and Virginia overlays, as CC0 JSON with a JSON Schema. Each survey records the exact checklist version it used.                                                                                                                          |
| 📑 **Fits office workflows**              | CSV import of the site list your office already keeps; CSV exports of results and of every measurement; role-based accounts (admin, surveyor, viewer); audit log.                                                                                                                                             |

## Screenshots

<table>
  <tr>
    <td colspan="2"><img src="docs/images/dashboard.png" alt="Dashboard with status tiles (12 sites: 3 accessible, 4 fixable, 2 barriers, 1 in progress, 2 not surveyed), a map of site markers and a searchable site list" /><br /><sub><b>Office dashboard.</b> Status tiles double as filters. The map shows the built-in offline basemap here; online it uses your configured MapLibre style.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/site.png" alt="Site page for Oak Hill Elementary School showing section results, voter page settings, survey history and the barriers with election-day fixes" /><br /><sub><b>Site page.</b> Results by section, barriers with their fixes, the site's kit list, and voter-page publishing.</sub></td>
    <td width="50%"><img src="docs/images/kit.png" alt="Election-day kit page with office-wide totals: traffic cones, signs, threshold ramps, portable ramps, door wedges, with the sites that need each" /><br /><sub><b>Election-day kit.</b> Office totals for procurement, or a packing list per site.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/checklist-browser.png" alt="Checklist browser showing parking items of the federal base plus California overlay, each with its diagram, pass rule, fix and citations" /><br /><sub><b>Checklist browser.</b> Every item with its diagram, pass rule, fix and citations, including overlay changes.</sub></td>
    <td width="50%">
      <img src="docs/images/survey-door.png" alt="Door clear width question on a phone with a top-down door diagram and a passing answer of 34 inches" width="49%" />
      <img src="docs/images/survey-threshold-dark.png" alt="Threshold question in dark mode" width="49%" />
      <br /><sub><b>Passing answer, and dark mode.</b> Large type, 48 px touch targets and high contrast for use outdoors.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/voter-page.png" alt="Voter page for Oak Hill Elementary School on a phone: status ‘Accessible on election day’, summary, accessible entrance description and parking directions" width="60%" /><br /><sub><b>Voter page</b> at <code>/p/&lt;site&gt;</code>: server-rendered, works without JavaScript.</sub></td>
    <td width="50%"><img src="docs/images/voter-features.png" alt="Voter page features list on a phone" width="60%" /><br /><sub><b>Features list</b> generated from the latest survey, with temporary measures marked “On election day”.</sub></td>
  </tr>
</table>

> The screenshots use fictional demo data (`pnpm db:seed`) around Richmond, Virginia.

## Quick start

### Docker Compose (recommended)

```bash
curl -O https://raw.githubusercontent.com/lobojoel2003/Pollramp/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/lobojoel2003/Pollramp/main/.env.example
```

Edit `.env` (at least `POSTGRES_PASSWORD`, `ORIGIN`, and optionally `POLLRAMP_ADMIN_EMAIL` /
`POLLRAMP_ADMIN_PASSWORD`), then:

```bash
docker compose up -d
```

Open <http://localhost:3000>. If you didn't set an admin account, the first visit offers to create
one. The image is published to `ghcr.io/lobojoel2003/pollramp` with tags `latest`, `1`, `1.0`,
`1.0.0` for releases and `edge` for the main branch.

### From source

Requires Node.js 22.12+, pnpm 10 (`corepack enable`) and PostgreSQL 14+.

```bash
git clone https://github.com/lobojoel2003/Pollramp.git
cd Pollramp
pnpm install
```

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/pollramp
pnpm dev
```

The server creates its tables on start-up. To load fictional demo sites and surveys:

```bash
POLLRAMP_URL=http://localhost:5173 POLLRAMP_EMAIL=admin@example.org POLLRAMP_PASSWORD='choose-a-password' pnpm db:seed
```

Production build:

```bash
pnpm build
```

```bash
ORIGIN=https://pollramp.example.gov BODY_SIZE_LIMIT=8M node build
```

### Release bundle without Docker

Each [GitHub release](https://github.com/lobojoel2003/Pollramp/releases) has
`pollramp-<version>.tar.gz` (the built server, migrations and lockfile) and
`pollramp-checklists-<version>.zip` (the CC0 checklist data), with `SHA256SUMS.txt`.

```bash
tar -xzf pollramp-1.0.0.tar.gz && cd pollramp-1.0.0
pnpm install --prod --frozen-lockfile
DATABASE_URL=postgres://… ORIGIN=https://… BODY_SIZE_LIMIT=8M node build
```

## Configuration

All settings are environment variables. See [`.env.example`](.env.example).

| Variable                                                    | Default                                                | Purpose                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                              | `postgres://postgres:postgres@localhost:5432/pollramp` | PostgreSQL connection string.                                                                 |
| `ORIGIN`                                                    | —                                                      | Public URL of the app (required behind a proxy). `http://` origins turn off `Secure` cookies. |
| `PORT`, `HOST`                                              | `3000`, `0.0.0.0`                                      | Where the Node server listens.                                                                |
| `BODY_SIZE_LIMIT`                                           | `512K` (adapter default)                               | Set to `8M` so photo uploads fit. The Docker image does this.                                 |
| `POLLRAMP_OFFICE_NAME`                                      | `Election Office`                                      | Shown in the app and on voter pages.                                                          |
| `POLLRAMP_DEFAULT_STATE`                                    | —                                                      | Two-letter state; picks the checklist overlay for new sites.                                  |
| `POLLRAMP_MAP_STYLE_URL`                                    | OpenFreeMap Liberty                                    | Any MapLibre style URL, or `offline` for the bundled county basemap only.                     |
| `POLLRAMP_MAP_LAT`, `POLLRAMP_MAP_LNG`, `POLLRAMP_MAP_ZOOM` | centre of the U.S.                                     | Initial map view before any sites exist.                                                      |
| `POLLRAMP_ADMIN_EMAIL`, `POLLRAMP_ADMIN_PASSWORD`           | —                                                      | Create this administrator on first start if there are no users.                               |
| `POLLRAMP_MIGRATE`                                          | `true`                                                 | Set to `false` to skip automatic migrations (then run `pnpm db:migrate`).                     |
| `POLLRAMP_SESSION_DAYS`                                     | `30`                                                   | Session length.                                                                               |
| `POLLRAMP_SECURE_COOKIES`                                   | auto                                                   | Force `Secure` session cookies on or off.                                                     |
| `POLLRAMP_MAX_PHOTO_BYTES`                                  | `6291456`                                              | Largest accepted photo (photos are resized to ≤ 1600 px on the device first).                 |

Command-line helpers: `pnpm db:migrate`, `pnpm user:create --email … --name … --role admin`,
`pnpm db:seed`. In Docker: `docker compose exec app node scripts/create-user.js --email … --name … --role admin`.

## Checklists

Checklists live in [`checklists/`](checklists) as versioned JSON, released under **CC0** so any
office, state or advocacy group can reuse them.

```
checklists/
├── schema/checklist.schema.json      JSON Schema for base checklists
├── schema/overlay.schema.json        JSON Schema for overlays
├── base/doj-base/1.0.0.json          Federal base: 2010 ADA Standards, DOJ checklist structure (80 items)
└── overlays/
    ├── us-ca/1.0.0.json              California: CBC 11B parking sizes, aisle markings, detectable warnings, 34–44 in hardware
    ├── us-fl/1.0.0.json              Florida: 12-ft spaces, blue outlines, permit-only signs, 44-in route
    └── us-va/1.0.0.json              Virginia: curbside voting (Va. Code § 24.2-649)
```

- **Items** carry one measurable prompt, a `pass` rule (`>=`, `<=`, `between`, `equals`, `in`, or
  a computed threshold such as ADA Table 208.2), a `diagram`, `when` conditions, citations, a
  `fix` (`kit`, `procedure` or `structural`) with sized kit items, and optional voter-facing text.
- **Overlays** patch thresholds and help text, add items or whole sections, remove items, and add
  kit items. The resolver records each item's `origin`, so the app shows a “California rule” badge.
- **Versions are immutable.** A survey stores `doj-base@1.0.0+us-va@1.0.0` and is always
  re-evaluated against exactly that data. Fixes ship as new files (`1.0.1.json`).
- `pnpm checklists:validate` checks every file against the JSON Schema and lints references, gates,
  kit ids and thresholds. CI runs it on every push.

The authoring guide is in [`checklists/README.md`](checklists/README.md). The state overlays cite
the statute or building-code section for each rule. Before relying on an overlay, an office should
review it against its state's current form; corrections are welcome as issues or pull requests.

## How it works

```mermaid
flowchart LR
  subgraph Device["Surveyor's phone or tablet (offline-first PWA)"]
    UI["SvelteKit app<br/>(client-rendered)"] --> Store["Reactive store"]
    Store <--> IDB[("IndexedDB<br/>sites · surveys · photos")]
    SW["Service worker<br/>app shell · tiles · photos"]
    Engine["Checklist engine<br/>resolve · evaluate · kit"]
    UI --> Engine
  end
  subgraph Server["Node server (adapter-node)"]
    API["/api: auth · sync · photos · import · export"] --> PG[("PostgreSQL")]
    Voter["/p: voter pages (SSR, no JS)"] --> PG
    API --> Engine2["Same checklist engine<br/>(re-evaluates on sync)"]
  end
  Store <-- "push dirty records,<br/>pull changes since last sync" --> API
  Public(("Voters")) --> Voter
  Partners(("Open data")) --> GeoJSON["/api/public/sites.geojson"] --> PG
```

- **Stack:** SvelteKit 3 + Svelte 5 (runes), TypeScript, Vite 8, MapLibre GL 6, PostgreSQL via
  postgres.js, Zod, idb. Self-hosted Atkinson Hyperlegible font.
- **One checklist engine** (`src/lib/checklist`) runs in the browser, on the server and in Node
  scripts. It resolves overlays, evaluates answers, sizes ramps, totals the kit and writes voter text.
- **Sync:** every record has a client `updatedAt`. Pushes are idempotent upserts and the newest
  edit wins, so an older offline edit never overwrites a newer one. The server re-evaluates every
  survey, so a site's stored status can be trusted.
- **Offline:** the service worker precaches the app shell, code, fonts, checklists and the county
  basemap for each build. App routes are served from the cached shell; voter pages are
  network-first with a cached fallback; photos and map tiles are cached as they are viewed.

<details>
<summary><b>HTTP API</b></summary>

| Method           | Path                                              | Role              | Purpose                                                       |
| ---------------- | ------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| `GET`            | `/api/health`                                     | —                 | Liveness/readiness, version, build number, commit             |
| `GET`            | `/api/config`                                     | —                 | Office name and map settings                                  |
| `POST`           | `/api/auth/setup`                                 | —                 | Create the first administrator (only when there are no users) |
| `POST`           | `/api/auth/login`, `/api/auth/logout`             | —                 | Session cookie sign-in / sign-out                             |
| `GET`            | `/api/auth/me`                                    | —                 | Current user                                                  |
| `GET`            | `/api/sync?since=`                                | viewer            | Sites, surveys and photo metadata changed since a time        |
| `PUT` / `DELETE` | `/api/sites/:id`                                  | surveyor / admin  | Upsert (last write wins) / delete a site                      |
| `PUT` / `DELETE` | `/api/surveys/:id`                                | surveyor          | Upsert (server re-evaluates) / delete a survey                |
| `PUT` / `GET`    | `/api/photos/:id`                                 | surveyor / viewer | Upload a photo as the raw body / download it                  |
| `POST`           | `/api/import/sites`                               | admin             | CSV import of polling places                                  |
| `GET`            | `/api/export/results.csv`, `items.csv`, `kit.csv` | viewer            | Spreadsheet exports                                           |
| `GET`            | `/api/users`, `POST /api/users`                   | admin             | List / add accounts                                           |
| `GET`            | `/api/public/sites.geojson`                       | —                 | Published sites as open data                                  |
| `GET`            | `/p`, `/p/:slug`                                  | —                 | Voter-facing pages                                            |

</details>

## Accessibility

Pollramp is used by surveyors outdoors and read by voters with disabilities, so accessibility is
tested, not assumed:

- End-to-end tests run [axe-core](https://github.com/dequelabs/axe-core) against WCAG 2.0/2.1 A and
  AA on the sign-in screen, the dashboard, survey questions and voter pages. A violation fails CI.
- Status is never shown by colour alone: every status has a symbol (✓ ! ✕ … ○) and a text label.
- 48 px minimum touch targets, inputs at 16 px or larger (no zoom-on-focus), visible focus rings,
  a skip link, and keyboard shortcuts (← → between questions).
- Every diagram is an SVG with a title and a description of what to measure.
- Atkinson Hyperlegible, designed by the Braille Institute for low-vision readers, is used
  throughout. Pages respect dark mode and reduced-motion settings.
- Voter pages are server-rendered HTML that works without JavaScript and prints cleanly.

## Development

```bash
pnpm dev                    # dev server at http://localhost:5173
pnpm check                  # svelte-check (TypeScript)
pnpm lint                   # Prettier + ESLint
pnpm test:unit              # Vitest: checklist engine, CSV, diagrams (200+ tests)
pnpm checklists:validate    # JSON Schema + semantic lint of all checklist files
pnpm build                  # production build into ./build
pnpm test:e2e               # Playwright + axe against the build (needs PostgreSQL)
pnpm screenshots            # regenerate docs/images from a seeded server
```

End-to-end tests use `TEST_DATABASE_URL` (default
`postgres://postgres:postgres@localhost:5432/pollramp_test`), which is **reset on every run**. Set
`PLAYWRIGHT_CHROMIUM_PATH` to reuse an existing Chromium instead of `playwright install`.

<details>
<summary><b>Project layout</b></summary>

```
checklists/                 CC0 checklist data and JSON Schemas
migrations/                 SQL migrations (applied automatically on start-up)
scripts/                    validate-checklists, migrate, create-user, seed-demo, screenshots, release-notes
src/
  lib/checklist/            the checklist engine (pure TypeScript, runs everywhere)
  lib/diagrams/             40 measurement diagrams (SVG Svelte components)
  lib/client/               offline store, IndexedDB, sync, photos, offline basemap
  lib/server/               config, database, auth, repository
  lib/components/           UI components (map, survey inputs, kit list, …)
  routes/(app)/             surveyor and office app (client-rendered, offline)
  routes/p/                 voter-facing pages (server-rendered)
  routes/api/               JSON and CSV API
  service-worker/           offline caching
tests/e2e/                  Playwright end-to-end and accessibility tests
```

</details>

## Versioning, builds and releases

- **Semantic versioning** for the app (`package.json`), recorded in [CHANGELOG.md](CHANGELOG.md)
  following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Checklist files are versioned
  separately and never edited once released.
- **Build numbers:** CI sets `BUILD_NUMBER` to the GitHub Actions run number. Every build embeds its
  version, build number, commit and build time. They appear in the app footer, in Settings → About,
  in `/api/health`, in the service-worker cache name, and as Docker image labels.
- **CI** ([`ci.yml`](.github/workflows/ci.yml)) runs on every push and pull request: checklist
  validation, Prettier, ESLint, svelte-check and unit tests; a production build with Playwright and
  axe end-to-end tests against PostgreSQL; and a Docker build with a smoke test.
  [CodeQL](.github/workflows/codeql.yml) scans the code, and Dependabot keeps dependencies current.
- **CD:** every green build of `main` publishes `ghcr.io/lobojoel2003/pollramp:edge` and
  `:<version>-build.<n>`.
- **Releases** ([`release.yml`](.github/workflows/release.yml)): pushing a tag `vX.Y.Z` that matches
  `package.json` runs the full test suite, publishes a multi-arch (amd64/arm64) image tagged
  `X.Y.Z`, `X.Y`, `X` and `latest` with provenance and SBOM, and creates the GitHub release with
  notes from the changelog, the server bundle, the checklist data zip and checksums.

To cut a release, move the `Unreleased` notes under a new version heading in `CHANGELOG.md`, then
either push a tag:

```bash
npm version 1.1.0 -m "Release v%s"
```

```bash
git push origin main --follow-tags
```

or bump `package.json` on `main` and run the **Release** workflow from the Actions tab with the
tag (for example `v1.1.0`); it creates the tag on `main` and does the rest.

## Security and privacy

- Passwords are hashed with scrypt. Sessions are random tokens stored only as SHA-256 hashes and
  kept in `HttpOnly`, `SameSite=Lax` cookies. Logins are rate-limited.
- Roles: **admin** (users, import, publish, delete), **surveyor** (sites and surveys), **viewer**
  (read-only).
- Strict Content-Security-Policy, `frame-ancestors 'none'`, `nosniff` and a narrow
  Permissions-Policy. Requests are validated with Zod, and CSV exports neutralize spreadsheet
  formulas.
- Photos are private to signed-in users. Only the one photo an admin picks for a published voter
  page is public. Signing out clears Pollramp's data and cached photos from the device.
- Report vulnerabilities privately: see [SECURITY.md](SECURITY.md).

## Roadmap

- More state overlays (Texas Accessibility Standards, Pennsylvania, Wisconsin, …) and a Spanish
  voter page.
- Object storage (S3-compatible) for photos at very large offices.
- Geocoding for imported addresses without coordinates.
- Election-day check-in mode: poll workers confirm each kit fix is in place.

## Contributing

Contributions are welcome, especially checklist corrections with citations from election officials,
surveyors and disability-rights advocates. See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

- **Application:** [GNU Affero General Public License v3.0 or later](LICENSE). If you run a
  modified Pollramp as a network service, you must offer its users the source code.
- **Checklist data** (`checklists/`): [CC0 1.0 Universal](checklists/LICENSE). Public domain:
  copy, adapt and publish it freely.
- Map data © OpenStreetMap contributors when using OpenFreeMap tiles. The offline basemap uses U.S.
  Census Bureau boundaries via [us-atlas](https://github.com/topojson/us-atlas).
