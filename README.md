# ORVA Protocol Site

Static, buildless Sites source for the ORVA Protocol informational website.

- Site output: `dist/`
- Branding asset: `dist/assets/orva-logo.png`
- Whitepaper asset: `dist/assets/orva-protocol-whitepaper-v1.pdf`
- No wallet connection, token purchase, external font, or unverified live protocol data is wired into this version.

The page describes project parameters and mechanisms as whitepaper plans. It does not imply that infrastructure, token issuance, contracts, audits, or income distributions are already live.

## Vercel deployment

Import this repository with the Root Directory left at the repository root (`./`).
The included `vercel.json` selects the Other framework preset, skips installation
and building, and publishes `dist/` as the website root.

If configuring the project manually, use:

- Framework Preset: Other
- Root Directory: `./` (repository root)
- Build Command: empty
- Install Command: empty
- Output Directory: `dist`

Deploy the latest commit from `main` after changing these settings.
