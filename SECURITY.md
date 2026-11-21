# Security policy

Pollramp stores information about polling places and the accounts of election staff. We take its
security seriously.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through
[GitHub security advisories](https://github.com/lobojoel2003/Pollramp/security/advisories/new).

Include the version and build number (shown in Settings → About and at `/api/health`), the steps to
reproduce, and the impact you expect. We aim to acknowledge reports within three business days and
to publish a fix and advisory as quickly as the severity requires.

## Hardening checklist for operators

- Serve Pollramp over HTTPS and set `ORIGIN` to the public `https://` URL (this enables `Secure`
  cookies).
- Use a strong, unique `POSTGRES_PASSWORD`, and don't expose PostgreSQL to the internet.
- Remove `POLLRAMP_ADMIN_PASSWORD` from the environment once the first administrator exists.
- Keep the image current: `ghcr.io/lobojoel2003/pollramp:1` follows the latest 1.x release.
- Back up the PostgreSQL volume; it holds all surveys and photos.
