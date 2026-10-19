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
	callouts: { do: 'Example', interview: 'Explain it' },
	plannedTopics: { 'Feature gallery': ['Component overrides'] },
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
	tutor: { enabled: true, intro: 'Help me study this Demo0ver template article.' },
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
color. `callouts.interview` becomes `Explain it`; unspecified labels keep their
default names and colors.

The package adds shared CSS and components first. A consumer can add `customCss`,
component overrides, and Starlight plugins when a page needs an extension.

`base` is used for search links, glossary links, tutor links, and the optional
Markdown export. The output directory keeps this demo at `demo/dist/starlight/`.

:::avoid
Keep project articles and SVG files in the consumer. Pass the diagram directory
to the package instead of copying those files into shared UI code.
:::
