# Project context

## Purpose

`@tech0ver/starlight` packages the UI/UX developed in `tech0ver/sysdis` for reuse
across `tech0ver` educational sites. A project should keep its content and site
settings, use the shared package, and receive shared UI changes by updating a
version and lockfile, then rebuilding.

The first users are `sysdis` and the planned concurrent-programming course `conc`.
This task creates the shared package and its demo. Migrating those projects is a
separate task; neither source checkout is changed by this extraction.

## Product decisions

- Use Astro, Starlight, Satteri Markdown processing, and Bun.
- Preserve the source reading experience: responsive navigation, right TOC,
  search, theme toggle, typography, reading position, article blocks, glossary
  tooltips, and theme-aware inline SVGs.
- Keep branding, navigation, home content, suggested search links, planned topics,
  footer content, glossary data, and diagrams configurable by each project.
- Share the original `sysdis` colors, typography, favicon, and callout color
  meanings across projects. Project differences are the name, callout labels,
  page content, and information hierarchy. Renaming a callout never recolors it.
- Keep the home page inside the same navigation shell as other pages, as in
  `sysdis`. Use the normal page template with a hero, retain the responsive sidebar,
  and omit the home page from sidebar items. The site name links back to home.
- Support ordinary Astro and Starlight customization alongside package defaults.
- Include one real package consumer named `Demo0ver`. Its pages explain and show
  the template's features. Keep demo text short, original, and in simple English.
- Use the public `tech0ver/starlight` GitHub repository and deliver source changes
  through pull requests. The initial code PR contains the package and demo.
  Build automation and GitHub Artifacts publication come in a separate PR.
- Package registry releases, production deployment, and consumer migrations are
  outside the initial code PR.

## Package boundary

The package owns reusable components, CSS, client scripts, Markdown processors,
configuration helpers, the organization favicon, and supporting assets. The demo owns its pages, glossary,
SVGs, optional services, and configuration. Consumers can use their own component
overrides and CSS instead of forking package files. Those low-level extension
points do not make per-project palettes or favicons part of the supported theme
configuration. Shared visual changes belong in this package.

Do not ship system-design articles or make `sysdis` a runtime dependency. Its
learning pyramid and subject-specific text are content rather than default UI.
An optional study prompt must use consumer configuration, not a system-design
instruction embedded in every site.

## Initial source baseline

The extraction starts from the local `sysdis` source on 2026-10-19. The resolved
dependencies inspected there are Astro 7.3.5, Starlight 0.42.5, and
`@astrojs/markdown-satteri` 0.4.2. These are the initial compatibility baseline;
broader versions require evidence rather than an untested compatibility claim.

Before extraction, the selected source fingerprint covered the files under
`sysdis/src/` plus its AGENTS.md, WRITING.md, ARTICLES.md, astro.config.mjs,
package.json, and bun.lock (206 files). The SHA-256, calculated by concatenating
sorted relative paths and bytes, was:

```text
e52c03f92d5c37cbd1d6039ff217caf9fa73e0781b5c55e5f382f5379d31c1bb
```

Preserve upstream attribution as described in [NOTICES.md](NOTICES.md).

## Verification target

The implementation must work as an installed package, not just inside a workspace.
Build the demo, test meaningful processor behavior, then pack the package
and build an independent temporary consumer from that archive. Check desktop and
phone layouts in both themes, including search, menu, navigation, glossary, and
diagrams. Record exact commands and any remaining limits in delivery notes.

No npm publication or migration of an existing site is required to prove local
package consumption.
