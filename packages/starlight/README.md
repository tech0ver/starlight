# @tech0ver/starlight

Reusable Astro/Starlight presentation for Tech0ver educational sites.

The package keeps shared navigation, responsive layout, theme controls, article
callouts, glossary tooltips, inline diagrams, and optional article study prompts
in one versioned dependency. A consumer owns its content and passes a fresh
configuration to `defineTech0verConfig`.

Colors, fonts, the organization favicon, and semantic callout colors are shared
across projects. Consumers configure their name, page content, navigation, and
callout labels through `callouts: { do: 'Try this' }`. Unspecified labels use the
shared defaults. The same labels appear in optional raw Markdown exports.

When enabled, the raw Markdown endpoint exports `.md` content entries. MDX-only
pages keep their rendered article URL in the study prompt because their imports
and components cannot be represented as plain Markdown safely.

The package is tested against Astro `7.3.5`, Starlight `0.42.5`, and
`@astrojs/markdown-satteri` `0.4.2`.
