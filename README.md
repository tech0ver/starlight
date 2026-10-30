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

To check glossary cards in tables, build the demo and run
`CHROMIUM_PATH=/path/to/chromium bun run check:glossary-browser` with a local
Chromium executable.

## What the demo shows

- One `Demo0ver` site explaining the template through working examples.
- Configurable names, callout labels, search suggestions, planned topics, and footer.
- Shared colors, typography, callout colors, and organization favicon.
- A home page, template overview, configuration guide, feature gallery, and glossary.
- Desktop navigation, mobile menu, right table of contents, theme toggle, search,
  saved reading position, article status, and favorites.
- Sidebar groups collapsed by a reader stay collapsed across visits on the same
  browser. The local storage key is `tech0ver:sidebar:collapsed:<project>`, where
  `<project>` is the URL-encoded `reading.storageKey` (`demo0ver` in the demo;
  otherwise it defaults to `base:` followed by the Astro base path). Storage is
  also scoped by the browser to the site's origin.
  Opening a group removes it from the saved list; groups configured as collapsed
  keep their default state.
- Article callouts, theme-aware inline SVGs, and first-mention glossary tooltips.
- An optional study prompt, plain Markdown article exports, and a `llms.txt` index.

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
  reading: { storageKey: 'demo0ver' },
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
| `reading` | Local article status, favorites, and section progress, with a stable project key and optional labels |
| `callouts` | Labels for the five semantic callout kinds; their colors stay shared |
| `searchSuggestions` | Project-owned links shown before a search query |
| `plannedTopics` | Unlinked topic labels keyed by an existing sidebar group label |
| `plannedTopLevel` | Unlinked topic labels before the top-level navigation entries |
| `footer` | Optional text and links; no fixed author or license statement |
| `socialImage`, `socialImageAlt` | Optional project-owned preview image and description |
| `glossary` | Entries, phrases to skip, and the glossary route or `false` |
| `diagrams` | Consumer-owned SVG directory |
| `tutor` | Optional study prompt; disabled by default |
| `rawMarkdown` | Optional article Markdown endpoints and `llms.txt` index; disabled by default |
| `mdastPlugins`, `hastPlugins` | Additional Satteri plugins after the shared processors |
| `starlight.customCss` | Consumer styles loaded after shared styles |
| `starlight.components` | Consumer replacements that take precedence over shared components |
| `starlight.plugins` | Consumer plugins run after the shared plugin |

Invalid shared settings stop configuration with a path such as
`glossary.entries[1].id` or `searchSuggestions[0].href`. Glossary IDs must be unique;
entries need a term, short meaning, and explanation. Links need an HTTP(S) URL or
a site-relative path and a label; footer links also accept `mailto:` and `tel:`.
Astro and Starlight validate their own options.

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
plannedTopLevel: ['Examples', { label: 'More guides', slug: 'more-guides' }],
plannedTopics: { 'Feature gallery': ['Component overrides', { label: 'More diagrams', slug: 'more-diagrams' }] },
```

`sidebarWidth` is a positive number of pixels and defaults to `200`. It controls
the desktop sidebar, the header and content offset, and the tablet drawer.
On phones, the menu still uses the full viewport width.

`plannedTopLevel` adds non-clickable labels with a **Planned** badge before the
regular top-level entries. `plannedTopics` adds them inside existing groups.
A string is hidden when an entry has the same label in that list. An object is
hidden when a published link in that list has the same page path, regardless of
the label. Set `slug` to the page path without `base`; leading and trailing
slashes are optional. Remove the planned setting when publishing the page.

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

### Article status and favorites

Reading controls are enabled by default for internal links inside sidebar groups,
including deeper groups. Top-level links, the home page, external links, and
planned topics have no controls. Opening an article changes **New** (empty circle)
to **Seen** (left half filled). **Mark as read** toggles between **Read** (a check
inside) and **Seen**. The checked button uses the primary accent color.

Authors choose every button location. In Markdown, put `::mark-as-read` on its own
line, separated from other content by blank lines:

```md
The article ends here.

::mark-as-read

## Quick reference

Optional reference content.

::mark-as-read
```

Each marker displays a centered button for the current article. Multiple buttons
stay in sync. The package does not add buttons at the end automatically or look
for particular headings. Omit the marker to leave a page without a button.
Markers inside code examples stay literal, and raw Markdown exports omit the
controls.

For an MDX page, use the public component at the chosen locations:

```mdx
import MarkAsRead from '@tech0ver/starlight/components/MarkAsRead.astro';

Article content.

<MarkAsRead />
```

Press the icon beside an article name to add or remove a favorite. Favorites use
a star with the same empty, half-filled, or checked state. Press the name to open
the article. Both controls have separate keyboard and touch targets.

Set a unique, permanent project key in every consumer:

```js
reading: {
  storageKey: 'my-project',
  labels: {
    markAsRead: 'Mark as read',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove favorite',
    new: 'New',
    seen: 'Seen',
    read: 'Read',
  },
},
```

Labels can be overridden separately. Use `reading.enabled: false` to disable all
reading controls. Component and CSS overrides remain available through Starlight.

State is stored in `localStorage`, one versioned record per article, under the
project key. Package versions, page titles, queries, fragments, and trailing
slashes are excluded from the key. Article paths are relative to `base`, so a
base path change on the same origin keeps the marks when `storageKey` stays the
same. Renaming an article's path gives it a new record. Without an explicit key,
the normalized base path isolates sites at different prefixes; set an explicit
key to preserve marks when moving the site and to identify each project clearly.

Updates appear in other open tabs. Marks stay on this browser and origin; they
do not sync across devices, and clearing site data removes them. When storage is
blocked or full, the controls still work for the current page, without guaranteed
persistence.

### Saved reading section

Articles save the last section in this browser. Opening an article without a
fragment restores that section automatically. An explicit fragment always takes
priority. Opening `#_top`, scrolling back above the first section, or entering an
ignored section removes the saved position. Entering another eligible section,
by scrolling or a direct link, saves it again. This does not change the article's
read status or favorites.

Configure section progress separately from the sidebar reading controls:

```js
reading: {
  storageKey: 'my-project',
  position: {
    enabled: true,
    ignoreSections: ['cheat-sheet', 'references'],
  },
},
```

`position.enabled` defaults to `true`, including when `reading.enabled` is `false`.
Set `position.enabled: false` to disable section tracking and restoration.
`ignoreSections` defaults to an empty array. Use heading IDs without `#`; an
ignored section includes its subsections until the next heading of the same or
higher level. The demo ignores `cheat-sheet`. A missing or newly ignored saved
heading is discarded on the next visit. Home, glossary, and splash pages do not
save section progress. Articles work even when their table of contents is hidden.

Position records use the same project key and base-relative article paths as
reading marks, but are stored separately. They stay on this browser and origin.
A link to `#_top` starts the article again and clears its position; a link without
a fragment resumes it. Without available storage, explicit anchors still work.

### Glossary

Supply entries through `glossary.entries`. Each entry has `id`, `term`, `short`,
and `explanation`; it can also have aliases, expansion, a read-more link, and pages
that explain the term. Internal read-more links use paths relative to the site's
base. Only the first eligible mention receives a definition card. Open it by hovering,
focusing the term, or tapping it. Press Escape or the close button to dismiss it;
tapping outside also closes it. Cards stay within the viewport and keep read-more
links available to keyboard users. Hover and focus also work without JavaScript.
Links, code, headings, and the entry's own explanatory page are excluded.

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
share of the article column so its text keeps the same scale. Diagrams are
centered in the text column when they fit. Wider diagrams scroll horizontally
from the left edge on narrow screens. See the full-width and compact versions
in the demo's feature gallery.

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
Inside an export, links to articles with Markdown exports also use `.md` URLs,
including links in glossary notes. Queries and heading fragments are preserved.
Other page links and assets keep their original targets, resolved to absolute URLs.

### Site index for AI assistants

`rawMarkdown: { enabled: true }` also generates `llms.txt` under the site's `base`,
for example `https://tech0ver.github.io/starlight/llms.txt` in the demo or
`https://example.com/llms.txt` at the domain root. It works without enabling the
study prompt. Set `site` to the deployed URL so the index uses the correct domain.

The index follows the [llms.txt proposal](https://llmstxt.org/): a site name,
the `starlight.description` summary when it is a string, and links with page titles
and descriptions. It includes all non-draft docs entries, including pages outside
the sidebar. Under `## Articles`, sidebar groups become `###` headings, deeper
groups use deeper headings, and links follow the menu order. Top-level articles
stay directly under `## Articles`. Articles outside the menu appear under
`### Other articles`. Empty groups and planned topics are omitted.
Articles link to their Markdown exports; the home page, glossary,
splash pages, and MDX pages link to rendered HTML, respecting `build.format`
and `trailingSlash`. Planned navigation labels are
not content entries and do not appear in the index.

Give an assistant the `llms.txt` URL and ask it to find a topic, then follow the
relevant article links. The index contains no article bodies, so the assistant
can fetch only what it needs. Pages also include `rel="describedby"` links to the
index and `rel="alternate" type="text/markdown"` links where an export exists.
An assistant must support or be directed to use these links; publishing the file
does not make every AI service discover it automatically.

The left navigation includes a plain text `llms.txt` link in a bottom row that
matches the 48px header height, with a full-width divider above it.
Long menus scroll between the site name and this row, keeping both visible.
Desktop menu scroll position is kept across page visits in the current tab.
It opens the text index in a new tab, keeping the current article available. The
same link appears in the mobile menu. It has no reading status or favorite control
and is hidden when raw Markdown exports are disabled.

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

### Board diagrams

Board diagrams use the same `::diagram{name="..."}` directive and diagram
folder. Give the SVG the class `sk-svg` to use the shared board colors and the
Comic Shanns Mono font. The font is loaded when a board diagram is displayed.
The SVG remains a site-owned file; the package does not generate drawings.

For a diagram with steps, put all views in one SVG. Add a JSON array of captions
in `data-steps` and a final caption in `data-final` on the SVG root. Wrap each
drawn element in `<g class="sk-el" data-step="1">`, numbering steps from 1.
Elements without a step belong to the first step. Escape attribute values as
required by XML. Each caption describes its view; the controls show its number.

```svg
<svg class="sk-svg" viewBox="0 0 720 200" role="img" aria-label="A site uses the shared package"
  data-steps='["A consumer creates a site", "The site uses the shared package"]' data-final="A site and the shared package"
  xmlns="http://www.w3.org/2000/svg">
  <g class="sk-el" data-step="1"><text class="sk-name" x="20" y="40">Consumer</text></g>
  <g class="sk-el" data-step="2"><text class="sk-name" x="200" y="40">Shared package</text></g>
</svg>
```

The diagram starts on the first step. Older elements fade, later elements are
hidden, and **All** shows the whole design. Without JavaScript the whole design
and its final caption are visible. When the step buttons do not fit, they
scroll horizontally between the arrows. Focus a control and use the left or
right arrow key to move between views. You can also focus the diagram and use
the arrow keys, Home, or End. The selected view is not saved.

For a static key-part view, put `data-focus-mode` on the SVG and `data-focus` on
its focused `sk-el` groups. The remaining groups fade. The shared drawing
classes are `sk-line`, `sk-dash`, `sk-bg`, `sk-name`, `sk-heading`, `sk-label`,
`sk-note`, and `sk-note-strong`. See the [demo](demo/src/content/docs/board-diagrams.md).
