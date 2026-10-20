# Project context

`@tech0ver/starlight` provides the UI/UX for tech0ver sites built around articles.
It uses Astro and Starlight, with Satteri for Markdown processing. Bun manages the
workspace and runs the development commands.

The goal is a comfortable reading experience and a shared place to improve it.
Sites receive those improvements by updating the package and rebuilding.

## Package and sites

The package owns the layout, navigation controls, styles, fonts, favicon, Markdown
features, and reading behavior. A consuming site owns its articles, name, home
content, navigation tree, glossary entries, and diagrams.

Colors, typography, favicon, and callout colors stay shared. Site settings can
change callout labels, but the meaning of each color stays consistent. Custom
CSS and component overrides are available for extensions; shared visual changes
belong here.

Each site gets its own config. The package must work from an installed archive,
with no dependency on another checkout or a particular machine.

## Reading experience

- The home page uses the same responsive sidebar as articles. It is left out of
  the navigation list; the site name links home.
- Articles have a table of contents, search, light and dark themes, and saved
  reading position.
- Markdown supports callouts, inline SVG diagrams, and glossary tooltips.
- Sites can enable an article prompt for an AI chat and plain Markdown exports.
  The site itself does not call an AI service.

## Demo and development

`Demo0ver` is the single demo. Its pages explain the template and show its
features with small examples. Keep it useful for checking changes as the package
grows.

Use simple English throughout the project. Keep dependencies and supported
versions in the package manifests and README. Follow [WORKFLOW.md](WORKFLOW.md)
for checks and pull requests, and preserve the licenses in [NOTICES.md](NOTICES.md).
