# Tech0ver Starlight

Shared UI/UX for tech0ver sites built around articles, using Astro and Starlight.
Keep articles and site settings in each project. Improve the shared package here,
then update its version in each site to receive layout and reading improvements.

Source: [tech0ver/starlight](https://github.com/tech0ver/starlight). The repository
contains the shared package and one `Demo0ver` demo. Release Please prepares
version and changelog updates. A maintainer publishes a GitHub Release to publish
the package to GitHub Packages. See [the release workflow](WORKFLOW.md#releases)
and [the changelog](packages/starlight/CHANGELOG.md).

## Run the demo

Use Node.js 24 and Bun 1.4.0. Install from the repository root:

```sh
bun install
bun run dev
```

The development site uses `/starlight/`. Search needs a production build's
Pagefind index. For a complete preview, build the demo:

```sh
bun run build
```

The output is `demo/dist/starlight/`. Use any static server with `demo/dist/` as
its document root.
For example, if Python 3 is installed:

```sh
python3 -m http.server 4340 --bind 127.0.0.1 --directory demo/dist
```

Open `http://localhost:4340/starlight/` on the same machine. When sharing a remote
preview, use the host's shared URL with the same path.

## What the demo shows

- One `Demo0ver` site explaining the template through working examples.
- Configurable names, callout labels, search suggestions, planned topics, and footer.
- Shared colors, typography, callout colors, and organization favicon.
- A home page, template overview, configuration guide, feature gallery, and glossary.
- Desktop navigation, mobile menu, right table of contents, theme toggle, search,
  and saved reading position.
- Article callouts, theme-aware inline SVGs, and first-mention glossary tooltips.
- An optional study prompt and a plain Markdown export for article readers.

See [the actual demo configuration](demo/astro.config.mjs) and
[the configuration guide](demo/src/content/docs/configuration.md).

## Use the package in another project

The workspace demo imports `@tech0ver/starlight` through a workspace dependency.
An independent project can install a published version from GitHub Packages.
Add this `.npmrc` to the consumer project:

```ini
@tech0ver:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Set `NODE_AUTH_TOKEN` in your environment to a personal access token (classic)
with `read:packages` and access to the package. GitHub's npm registry requires
an access token even for public packages. Keep token values out of committed files.
Then install the latest published package with the tested peer versions:

```sh
bun add @tech0ver/starlight@latest astro@7.3.5 @astrojs/starlight@0.42.5 @astrojs/markdown-satteri@0.4.2
```

In a consumer's GitHub Actions workflow, use its `GITHUB_TOKEN` with
`packages: read` and grant that repository read access under the package's
**Manage Actions access** settings. Pass the token as `NODE_AUTH_TOKEN` during
installation. Rebuild the consumer after updating its dependency and lockfile.

To test a local change before publication, install an archive instead.
From `packages/starlight/`, run:

```sh
bun pm pack
```

Then install that archive from the consumer project, using its real path and the
tested dependency versions. Replace `VERSION` with the version in the generated
archive's filename:

```sh
bun add /path/to/tech0ver-starlight-VERSION.tgz astro@7.3.5 @astrojs/starlight@0.42.5 @astrojs/markdown-satteri@0.4.2
```

In the consumer's `astro.config.mjs`:

```js
import { defineTech0verConfig } from '@tech0ver/starlight';

export default defineTech0verConfig({
  site: 'https://example.com',
  base: '/starlight',
  brand: { name: 'Demo', suffix: '0ver' },
  callouts: { do: 'Example', explain: 'Explain it' },
  searchSuggestions: [
    { href: 'getting-started', label: 'Getting started' },
  ],
  footer: { text: 'Shared template demo' },
  starlight: {
    title: 'Demo0ver',
    sidebar: [{ label: 'Start here', items: ['getting-started'] }],
  },
});
```

Keep a normal Starlight docs collection and create the pages named in the sidebar.
The helper provides presentation and Markdown processing. Articles stay in the site.
See [the demo collection](demo/src/content.config.ts) and
[its getting-started page](demo/src/content/docs/getting-started.md).

## Configuration

The top-level options include ordinary Astro settings such as `site`, `base`,
`root`, `outDir`, `integrations`, and `vite`. Put ordinary Starlight settings under
`starlight`. Shared UI options are listed below; their types are in
[index.d.ts](packages/starlight/src/index.d.ts).

| Option | Purpose |
|---|---|
| `brand` | Name and optional accent suffix, using the shared fonts and colors |
| `sidebarWidth` | Desktop sidebar and tablet drawer width in pixels; a positive number, default `200` |
| `callouts` | Labels for the five semantic callout kinds; their colors stay shared |
| `searchSuggestions` | Project-owned links shown before a search query |
| `plannedTopics` | Unlinked topic labels keyed by an existing sidebar group label |
| `plannedTopLevel` | Unlinked topic labels before the top-level navigation entries |
| `footer` | Optional text and links; no fixed author or license statement |
| `socialImage`, `socialImageAlt` | Optional project-owned preview image and description |
| `glossary` | Entries, phrases to skip, and the glossary route or `false` |
| `diagrams` | Consumer-owned SVG directory |
| `tutor` | Optional study prompt; disabled by default |
| `rawMarkdown` | Optional article Markdown endpoints; disabled by default |
| `mdastPlugins`, `hastPlugins` | Additional Satteri plugins after the shared processors |
| `starlight.customCss` | Consumer styles loaded after shared styles |
| `starlight.components` | Consumer replacements that take precedence over shared components |
| `starlight.plugins` | Consumer plugins run after the shared plugin |

The helper owns `markdown.processor` to connect callouts, SVGs, and glossary
tooltips through Satteri. Extend that pipeline with the plugin options rather than
supplying a second Markdown processor. Additional Astro integrations and Vite
plugins are retained. Existing Starlight route middleware stays part of the route
pipeline alongside the shared middleware.

Colors, fonts, the organization favicon, and callout color meanings are shared
across projects. The package supplies the favicon; a consumer does not need a
public favicon file. Shared visual changes belong in the package. Project CSS
and component overrides can extend content or behavior. Keep visual improvements
in the shared package.

### Navigation layout

Choose a sidebar width that fits the site's navigation labels:

```js
sidebarWidth: 256,
plannedTopLevel: ['Examples'],
plannedTopics: { 'Feature gallery': ['Component overrides'] },
```

`sidebarWidth` is a positive number of pixels and defaults to `200`. It controls
the desktop sidebar, the header and content offset, and the tablet drawer.
On phones, the menu still uses the full viewport width.

`plannedTopLevel` adds non-clickable labels with a **Planned** badge before the
regular top-level entries. `plannedTopics` adds them inside existing groups.
A planned label is hidden when a published entry has the same label in that
list. Remove its planned setting when publishing the page.

The active table-of-contents link uses the accent color and bold text on both
desktop and mobile. It follows the current section as the reader scrolls.
The desktop panel scrolls to keep the active link visible in long outlines.

### Home page layout

Use the normal page template with a `hero` block to keep the same sidebar on the
home page as on other pages. Do not set `template: splash`: that template hides
the sidebar. Set `tableOfContents: false` and `pagefind: false` for the home page.
Omit `index` from `starlight.sidebar`; the site name already links home. On narrow
screens, the sidebar uses the same menu button as the rest of the site.

See [the demo home page](demo/src/content/docs/index.md).

### Glossary

Supply entries through `glossary.entries`. Each entry has `id`, `term`, `short`,
and `explanation`; it can also have aliases, expansion, a read-more link, and pages
that explain the term. Internal read-more links use paths relative to the site's
base. Only the first eligible mention receives a tooltip. Links, code, headings,
and the entry's own explanatory page are excluded.

The glossary renders each term as a compact level-two heading with an anchor
link. The table of contents highlights the term while scrolling. Entry IDs stay
the URL fragments, so links from article tooltips and copied term links agree.

Create a glossary page yourself, using the public component. The route option
controls glossary-specific TOC behavior; it does not create the page. See
[the demo glossary](demo/src/content/docs/glossary.mdx).

### Diagrams and callouts

Point the package at your own SVG directory using a URL relative to the config:

```js
diagrams: { directory: new URL('./src/diagrams/', import.meta.url) }
```

Insert a trusted, project-owned SVG with `::diagram{name="example"}`. Use the
shared `dg-*` classes to make it follow both themes. SVG files and their titles
stay in the consumer; the package owns rendering and styles.

Diagrams use a 720-unit reference width. A narrower SVG uses a proportional
share of the article column so its text keeps the same scale. See the full-width
and compact versions in the demo's feature gallery.

Container directives `:::do`, `:::tradeoff`, `:::explain`, `:::avoid`, and
`:::distinguish` render article callouts. The feature gallery exercises all five.
Override their labels with `callouts`, for example:

```js
callouts: {
  do: 'Recommended approach',
  tradeoff: 'What you trade',
  explain: 'Explain it',
  avoid: 'Common mistake',
  distinguish: 'Keep these separate',
}
```

Unspecified labels retain their defaults. The directive names and semantic colors
stay the same. Plain Markdown exports use the same configured labels as the page.

### Optional study prompt

Enable `tutor.enabled` and `rawMarkdown.enabled` together to offer a prompt linked
to a plain Markdown article export. Set `tutor.title` for the block heading and
`tutor.intro` for the first paragraph of the copied prompt. When omitted, the
heading is **Study this article with an AI assistant**. For example:

```js
tutor: {
  enabled: true,
  title: 'Explore this article with AI',
  intro: 'Help me understand this Demo0ver article.',
},
rawMarkdown: { enabled: true },
```

The prompt is copied into the reader's chosen AI chat; the site does not call an
AI service. Set `site` to the deployed site's URL so copied prompts and article
links include the correct domain and base path. In the demo, the Markdown link
is `https://tech0ver.github.io/starlight/reading.md`.
Raw Markdown exports cover `.md` entries. MDX pages keep their rendered page URL
because their components and imports are not plain Markdown.

### Content cache

Astro can retain rendered Markdown after changes to processor code, glossary data,
or SVG files. Hot reload for those external inputs is not guaranteed by this
package. If a page still shows old content, stop the development server,
remove the generated content store, then rebuild or restart. With the demo's
default Astro cache locations, run these commands from `demo/`:

```sh
rm -f node_modules/.astro/data-store.json .astro/data-store.json
```

For a consumer with a custom cache directory, use its generated content-store
location instead. Recheck the rendered output after a processor or package update.

## Verify a change

```sh
bun run check:release
bun test
bun run build
bun run check:package
```

The package check packs the actual manifest and installs it into an independent
temporary consumer outside the workspace. It checks that package-name imports,
components, assets, and the build work without a sibling checkout. Browser checks
are also needed for visual or interaction changes; follow WORKFLOW.md.

The tested versions are Astro 7.3.5, Starlight 0.42.5, and Satteri 0.4.2.
Peer dependencies are pinned to those versions. Changing the package version
does not update an already-built consumer: update its dependency and lockfile,
then rebuild. Publishing and consumer migrations are separate tasks.

## License

[MIT](LICENSE). Third-party code and assets keep the licenses listed in
[NOTICES.md](NOTICES.md).

## Project documents

- [Context and boundaries](CONTEXT.md)
- [Agent instructions](AGENTS.md)
- [Change workflow](WORKFLOW.md)
- [Third-party notices](NOTICES.md)
