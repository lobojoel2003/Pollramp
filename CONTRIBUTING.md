# Contributing to Pollramp

Thank you for helping make polling places accessible. Election officials, surveyors,
disability-rights advocates, designers and developers are all welcome.

## Ways to help

- **Checklist corrections and new state overlays.** Open a
  [checklist issue](https://github.com/lobojoel2003/Pollramp/issues/new?template=checklist_correction.yml)
  with the item id and a citation, or send a pull request (see `checklists/README.md`).
- **Bug reports.** Include the version and build number shown at the bottom of every page.
- **Field testing.** Try a survey on a real site and tell us what slowed you down.
- **Code.** Pick an issue labelled `good first issue`, or propose a change in an issue first.

## Development setup

You need Node.js 22.12+, pnpm 10 (`corepack enable`) and PostgreSQL 14+.

```bash
pnpm install
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/pollramp
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm checklists:validate && pnpm lint && pnpm check && pnpm test:unit
```

```bash
pnpm build && pnpm test:e2e
```

The end-to-end suite resets the database in `TEST_DATABASE_URL` (default
`postgres://postgres:postgres@localhost:5432/pollramp_test`) on every run.

## Guidelines

- **Accessibility is a feature.** New UI must pass the axe checks in the end-to-end suite, work
  with a keyboard, have 48 px touch targets, and never convey status by colour alone.
- **Offline first.** Anything a surveyor does must work without a connection and sync later.
- **One engine.** Checklist logic belongs in `src/lib/checklist` (pure TypeScript, no framework
  imports) so the browser, server and scripts agree.
- **Published checklist versions are immutable.** Fix data by adding a new version file and
  updating the defaults; surveys keep evaluating against the version they were taken with.
- **Plain language.** Prompts are single, measurable questions. Voter text is short and concrete.
- Formatting is Prettier, linting is ESLint, and both run in CI.
- Add a line under `## [Unreleased]` in `CHANGELOG.md` for user-visible changes.

## Commit and release flow

- Work on a branch and open a pull request against `main`; CI must be green.
- Maintainers release by moving the Unreleased notes under a new version heading, running
  `npm version <x.y.z> -m "Release v%s"`, and pushing with `--follow-tags`. The release workflow
  does the rest.

By contributing you agree that your code is licensed under the AGPL-3.0-or-later and that
checklist data you contribute is dedicated to the public domain under CC0 1.0.
