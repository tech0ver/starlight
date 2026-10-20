# Changelog

## 0.1.0

Initial release of `@tech0ver/starlight`, a shared UI package for article sites
built with Astro and Starlight.

### Reading experience

- Responsive page layout with desktop navigation, a mobile menu, and an article
  table of contents. Home pages can use the same sidebar as articles.
- Light and dark themes, search with configurable suggestions, and saved reading
  position.
- Shared colors, fonts, organization favicon, and semantic callout colors.

### Article features

- Five Markdown callouts: `do`, `tradeoff`, `explain`, `avoid`, and `distinguish`.
  Sites can change their labels while keeping their shared color meanings.
- First-mention glossary tooltips and a public glossary component. Sites provide
  their own entries and glossary page.
- Inline rendering of trusted, site-owned SVG diagrams, with shared classes for
  light and dark themes.
- Optional plain Markdown exports for `.md` articles and an optional study prompt
  that readers can copy into their chosen AI chat. MDX pages keep their rendered
  page URL in the prompt.

### Site integration

- `defineTech0verConfig` connects the shared UI and Markdown processing. Each site
  owns its articles, navigation, name, footer, glossary entries, and diagrams.
- Support for the domain root and URL prefixes, plus Astro integrations, Vite
  plugins, Starlight plugins, component overrides, and custom CSS.
- Public package imports for components, styles, plugins, helpers, and fonts.
  Installation is checked with a packed archive in a separate consumer project.
- Tested peer versions: Astro `7.3.5`, Starlight `0.42.5`, and
  `@astrojs/markdown-satteri` `0.4.2`.

The project uses the MIT license and includes third-party license notices.
