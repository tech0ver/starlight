# Changelog

## [0.5.0](https://github.com/tech0ver/starlight/compare/v0.4.0...v0.5.0) (2026-10-28)


### Features

* remember collapsed sidebar groups ([#18](https://github.com/tech0ver/starlight/issues/18)) ([6b38f89](https://github.com/tech0ver/starlight/commit/6b38f89eb04877c30e73e3355551b982f222d6c0))

## [0.4.0](https://github.com/tech0ver/starlight/compare/v0.3.0...v0.4.0) (2026-10-27)


### Features

* add article reading status and favorites ([#15](https://github.com/tech0ver/starlight/issues/15)) ([415823a](https://github.com/tech0ver/starlight/commit/415823a0e5b7569b72ebccd3f1adfbbd18d28e25))


### Bug Fixes

* show glossary tooltips above the article outline ([#17](https://github.com/tech0ver/starlight/issues/17)) ([9122431](https://github.com/tech0ver/starlight/commit/91224319f6e8e0a6dc2622b1a8d61dbb2a87e6fe))

## [0.3.0](https://github.com/tech0ver/starlight/compare/v0.2.1...v0.3.0) (2026-10-27)


### Features

* make the article study heading configurable ([#12](https://github.com/tech0ver/starlight/issues/12)) ([6d0f0fa](https://github.com/tech0ver/starlight/commit/6d0f0fa57dd48eac64ceb3802391d81eb2c2eb7c))


### Bug Fixes

* align glossary navigation and planned sidebar labels ([#14](https://github.com/tech0ver/starlight/issues/14)) ([83df91a](https://github.com/tech0ver/starlight/commit/83df91a2e9057321042b80a9cbf5440160c35fbe))

## [0.2.1](https://github.com/tech0ver/starlight/compare/v0.2.0...v0.2.1) (2026-10-27)


### Bug Fixes

* preserve reading position and tablet layout ([#9](https://github.com/tech0ver/starlight/issues/9)) ([ea0c7b0](https://github.com/tech0ver/starlight/commit/ea0c7b026e9c84313dbf6d753e602fed7e76fad3))

## [0.2.0](https://github.com/tech0ver/starlight/compare/v0.1.0...v0.2.0) (2026-10-27)


### Features

* add sidebar options and highlight active TOC links ([#3](https://github.com/tech0ver/starlight/issues/3)) ([3e47df3](https://github.com/tech0ver/starlight/commit/3e47df3dba8fd545387df7653e748c0cf552bafa))


### Bug Fixes

* preserve compact diagram widths ([#6](https://github.com/tech0ver/starlight/issues/6)) ([75be345](https://github.com/tech0ver/starlight/commit/75be345c966b25d22d08cdeee9542625b66cf99e))
* use absolute article URLs in study prompts ([#5](https://github.com/tech0ver/starlight/issues/5)) ([5440fbe](https://github.com/tech0ver/starlight/commit/5440fbebf9461b80e49be56bf266ea6d9c0447a9))

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
