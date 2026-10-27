---
title: Configuration
description: See the main settings for this Demo0ver consumer.
---

The demo calls the package once from `astro.config.mjs`:

```js
import { defineTech0verConfig } from '@tech0ver/starlight';
import { fileURLToPath } from 'node:url';

const glossaryEntries = [
	{ id: 'consumer', term: 'Consumer', short: 'A project that uses the package.', explanation: 'The consumer owns content and site settings.' },
	{ id: 'callout', term: 'Callout', short: 'A styled guidance block.', explanation: 'Its semantic color stays shared when its label changes.' },
	{ id: 'base-path', term: 'Base path', short: 'The URL prefix for a site.', explanation: 'It keeps generated links under the deployed site.' },
];

export default defineTech0verConfig({
	site: 'https://tech0ver.github.io',
	root: fileURLToPath(new URL('./', import.meta.url)),
	base: '/starlight',
	outDir: fileURLToPath(new URL('./dist/starlight/', import.meta.url)),
	brand: { name: 'Demo', suffix: '0ver' },
	sidebarWidth: 256,
	reading: { storageKey: 'demo0ver' },
	callouts: { do: 'Example', explain: 'Explain it' },
	plannedTopics: { 'Feature gallery': ['Component overrides'] },
	plannedTopLevel: ['Examples'],
	searchSuggestions: [
		{ href: 'getting-started', label: 'Getting started' },
		{ href: 'reading', label: 'Feature gallery' },
	],
	footer: {
		text: 'Demo consumer',
		links: [{ href: 'https://github.com/tech0ver/starlight', label: 'Repository' }],
	},
	glossary: { entries: glossaryEntries, route: 'glossary' },
	diagrams: { directory: new URL('./src/diagrams/', import.meta.url) },
	tutor: {
		enabled: true,
		title: 'Explore this article with AI',
		intro: 'Help me understand this Demo0ver article.',
	},
	rawMarkdown: { enabled: true },
	starlight: {
		title: 'Demo0ver',
		sidebar: [
			{ label: 'Learn the template', items: ['getting-started', 'configuration'] },
			{ label: 'Feature gallery', items: ['reading'] },
			'glossary',
		],
	},
});
```

The package keeps the shared colors, fonts, organization favicon, and semantic
callout colors. This consumer configures its name, labels, pages, and navigation.
Changing `callouts.do` to `Example` changes the label while keeping the shared
color. `callouts.explain` becomes `Explain it`; unspecified labels keep their
default names and colors.

The demo sets `sidebarWidth` to `256` pixels so its navigation labels have room.
The default is `200`. Desktop content and the header move with the sidebar;
the tablet drawer uses the same width, and the phone menu stays full width.

`plannedTopLevel` shows **Examples** with a **Planned** badge above the groups.
`plannedTopics` shows **Component overrides** inside **Feature gallery**. These
labels have no links. When a published entry uses the same label at that level,
the planned label is hidden. Remove the planned setting when publishing it.

The active link in the table of contents uses accent color and bold text.
Scroll the [feature gallery](../reading/) to check it on desktop or open
**On this page** on a phone.

`reading.storageKey` gives this project's reading status and favorites a stable
place in browser storage. Use a different key for each project on the same domain,
and keep it unchanged across releases. Article paths are relative to `base`, so
moving the whole site to another prefix on the same domain keeps its marks.
See the [feature gallery](../reading/#reading-status-and-favorites) to try the controls.

Add `::mark-as-read` on its own line, with a blank line before and after it, at
each place where an article needs a **Mark as read** button. The package does not
add buttons automatically or look for specific heading names.

`tutor.title` sets the article tools heading. This demo uses **Explore this
article with AI**. If omitted, the heading stays **Study this article with an AI
assistant**. `tutor.intro` sets the first paragraph of the copied prompt.

The package adds shared CSS and components first. A consumer can add `customCss`,
component overrides, and Starlight plugins when a page needs an extension.

`base` is used for search links, glossary links, tutor links, and the optional
Markdown export. The output directory keeps this demo at `demo/dist/starlight/`.

:::avoid
Keep project articles and SVG files in the consumer. Pass the diagram directory
to the package instead of copying those files into shared UI code.
:::

::mark-as-read
