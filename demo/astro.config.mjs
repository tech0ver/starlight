import { defineTech0verConfig } from '@tech0ver/starlight';
import { fileURLToPath } from 'node:url';

const glossaryEntries = [
	{
		id: 'consumer',
		term: 'Consumer',
		aliases: ['consumer', 'Consumer'],
		short: 'A project that uses the shared documentation package.',
		explanation: 'The consumer owns its pages, navigation, glossary, diagrams, and site settings while the package supplies the shared reading experience.',
		readMore: { href: 'configuration', label: 'Configuration: set up the consumer' },
	},
	{
		id: 'callout',
		term: 'Callout',
		aliases: ['callout', 'Callout', 'callouts', 'Callouts'],
		short: 'A styled block that highlights a useful kind of guidance.',
		explanation: 'Callouts keep examples, trade-offs, explanations, warnings, and distinctions easy to scan. Their semantic colors stay shared when labels change.',
	},
	{
		id: 'base-path',
		term: 'Base path',
		aliases: ['base path', 'Base path'],
		short: 'The URL prefix where a site is served.',
		explanation: 'The base path keeps links, assets, search, glossary tooltips, and raw Markdown exports inside the deployed site.',
		readMore: { href: 'configuration', label: 'Configuration: set the base path' },
	},
];

export default defineTech0verConfig({
	site: 'https://tech0ver.github.io',
	root: fileURLToPath(new URL('./', import.meta.url)),
	base: '/starlight',
	outDir: fileURLToPath(new URL('./dist/starlight/', import.meta.url)),
	brand: { name: 'Demo', suffix: '0ver' },
	sidebarWidth: 256,
	reading: {
		storageKey: 'demo0ver',
		position: { ignoreSections: ['cheat-sheet'] },
	},
	callouts: { do: 'Example', explain: 'Explain it' },
	socialImage: '/social-preview.svg',
	socialImageAlt: 'Demo0ver reusable Starlight template demo.',
	plannedTopics: { 'Feature gallery': ['Component overrides', { label: 'More diagrams', slug: 'more-diagrams' }, { label: 'Gallery', slug: 'reading' }] },
	plannedTopLevel: ['Examples', { label: 'More guides', slug: 'more-guides' }, { label: 'Terms', slug: 'glossary' }],
	searchSuggestions: [
		{ href: 'getting-started', label: 'Getting started', description: 'See the template shell and navigation.' },
		{ href: 'configuration', label: 'Configuration', description: 'Inspect one consumer setup and its labels.' },
		{ href: 'reading', label: 'Feature gallery', description: 'Try the shared Markdown and diagram features.' },
	],
	footer: { text: 'Demo consumer', links: [{ href: 'https://github.com/tech0ver/starlight', label: 'Repository' }] },
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
		description: 'A compact demonstration of reusable documentation UI.',
		sidebar: [
			{ label: 'Learn the template', items: ['getting-started', 'configuration'] },
			{ label: 'Feature gallery', items: ['reading', 'board-diagrams'] },
			'glossary',
		],
		pagination: true,
		lastUpdated: false,
	},
});
