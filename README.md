# ORVA Protocol Site

Static, buildless Sites source for the ORVA Protocol informational website.

- Site output: `dist/`
- Branding asset: `dist/assets/orva-logo.png`
- Whitepaper asset: `dist/assets/orva-protocol-whitepaper-v1.pdf`
- Web whitepaper: `dist/whitepaper/index.html` (15 chapters, 3 tables, 2 localized diagrams)
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

## Languages and content maintenance

The homepage and complete web whitepaper support Traditional Chinese (`zh-Hant`,
the first-visit default), English (`en`), Korean (`ko`), Japanese (`ja`), Vietnamese
(`vi`) and Urdu (`ur`, right-to-left). Use `?lang=en` to share a language. A valid
URL selection overrides the saved preference; an invalid parameter selects
Traditional Chinese. The site does not infer a language from browser settings.

Whitepaper headings have stable IDs, for example `/whitepaper/?lang=en#section-8-3`.
Language selection preserves the current chapter and carries across page links.
The downloadable PDF remains the original Simplified Chinese document.

The site is static: no server, production build, or live translation API is required.
Translations are stored in `content/`, with editorial copy in `content/overrides.json`
and terminology corrections in `scripts/editorial.cjs`. They were prepared with
machine assistance and editorial review of terminology, headings and key figures;
they have not been certified by professional translators. The original PDF remains
the source for the whitepaper's statements and numbers.

For maintenance, use Node.js 22.13+ or 24:

```sh
npm ci
npm run build:content
npm run validate
npx http-server dist -p 8000 -c-1
```

`build:content` generates the Traditional Chinese HTML and six local JSON dictionaries
using only checked-in content. Commit the generated `dist/` changes together with
the edited source. `validate` checks PDF body coverage, chapter/table/diagram counts,
translations, formulas, allocation percentages, internal links and language behavior.

`scripts/import-content.cjs` and `scripts/prepare-translations.cjs` document the initial
import workflow only; do not rerun them for normal editing. The latter contacts an
external translation service and is never used by the site or deployment.
`content/pdf-extraction.json` records source lines and page coordinates for auditing.
PDF headers, page numbers and the print contents pages are replaced by web navigation;
all main text, tables, figures and the final note are retained.
