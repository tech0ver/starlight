import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveCalloutLabels } from './lib/callouts.mjs';

const DEFAULT_BASE = '/';

export const packageRoot = new URL('./', import.meta.url);
export const packagePaths = {
	styles: [
		fileURLToPath(new URL('./styles/theme.css', packageRoot)),
		fileURLToPath(new URL('./styles/ui.css', packageRoot)),
		fileURLToPath(new URL('./styles/glossary.css', packageRoot)),
		fileURLToPath(new URL('./styles/article.css', packageRoot)),
	],
	components: {
		Head: fileURLToPath(new URL('./components/Head.astro', packageRoot)),
		ThemeSelect: fileURLToPath(new URL('./components/ThemeToggle.astro', packageRoot)),
		SiteTitle: fileURLToPath(new URL('./components/SiteTitle.astro', packageRoot)),
		PageFrame: fileURLToPath(new URL('./components/PageFrame.astro', packageRoot)),
		MobileMenuToggle: fileURLToPath(new URL('./components/MenuToggle.astro', packageRoot)),
		TwoColumnContent: fileURLToPath(new URL('./components/TwoColumnContent.astro', packageRoot)),
		PageSidebar: fileURLToPath(new URL('./components/PageSidebar.astro', packageRoot)),
		Sidebar: fileURLToPath(new URL('./components/Sidebar.astro', packageRoot)),
		PageTitle: fileURLToPath(new URL('./components/PageTitle.astro', packageRoot)),
		Pagination: fileURLToPath(new URL('./components/Pagination.astro', packageRoot)),
		Search: fileURLToPath(new URL('./components/Search.astro', packageRoot)),
		Hero: fileURLToPath(new URL('./components/Hero.astro', packageRoot)),
		Footer: fileURLToPath(new URL('./components/Footer.astro', packageRoot)),
	},
	routeData: fileURLToPath(new URL('./route-data.mjs', packageRoot)),
	rawMarkdown: fileURLToPath(new URL('./routes/raw-markdown.ts', packageRoot)),
};

export function normalizeBase(base = DEFAULT_BASE) {
	if (!base || base === '/') return '/';
	const value = String(base);
	return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function clone(value) {
	if (value === undefined) return undefined;
	return JSON.parse(JSON.stringify(value));
}

function brandName(brand, title) {
	const input = brand && typeof brand === 'object' ? brand : {};
	const name = String(input.name ?? title ?? 'Tech0ver');
	const suffix = String(input.suffix ?? '');
	return { name, suffix, fullName: `${name}${suffix}` };
}

function normalizeDirectory(directory, root) {
	if (!directory) return undefined;
	if (directory instanceof URL) return new URL(directory.href.endsWith('/') ? directory.href : `${directory.href}/`);
	const value = String(directory);
	if (/^[a-z]+:\/\//i.test(value)) {
		const url = new URL(value);
		return new URL(url.href.endsWith('/') ? url.href : `${url.href}/`);
	}
	if (isAbsolute(value)) return pathToFileURL(value.endsWith('/') ? value : `${value}/`);
	const rootPath = root instanceof URL ? fileURLToPath(root) : resolve(String(root ?? process.cwd()));
	const rootUrl = pathToFileURL(rootPath.endsWith('/') ? rootPath : `${rootPath}/`);
	return new URL(value.endsWith('/') ? value : `${value}/`, rootUrl);
}

export function normalizeTech0verOptions(input = {}) {
	// Keep plugin hook functions and component paths intact. The serializable
	// consumer data is copied separately before it crosses the virtual module.
	const starlight = { ...(input.starlight ?? {}) };
	const title = starlight.title ?? input.title ?? 'Tech0ver';
	const base = normalizeBase(input.base ?? DEFAULT_BASE);
	const brand = brandName(input.brand, typeof title === 'string' ? title : 'Tech0ver');
	const glossary = input.glossary && typeof input.glossary === 'object' ? input.glossary : {};
	const search = input.search && typeof input.search === 'object' ? input.search : {};
	const tutor = input.tutor && typeof input.tutor === 'object' ? input.tutor : {};
	const rawMarkdown = input.rawMarkdown && typeof input.rawMarkdown === 'object' ? input.rawMarkdown : {};
	const diagrams = input.diagrams && typeof input.diagrams === 'object' ? input.diagrams : {};
	const sidebarWidth = input.sidebarWidth ?? 200;
	if (typeof sidebarWidth !== 'number' || !Number.isFinite(sidebarWidth) || sidebarWidth <= 0) {
		throw new Error('sidebarWidth must be a positive number of pixels.');
	}

	return {
		base,
		brand,
		sidebarWidth,
		callouts: resolveCalloutLabels(input.callouts),
		plannedTopics: clone(input.plannedTopics ?? {}),
		plannedTopLevel: clone(input.plannedTopLevel ?? []),
		searchSuggestions: clone(input.searchSuggestions ?? search.suggestions ?? []),
		footer: clone(input.footer ?? {}),
		socialImage: input.socialImage ?? input.social?.image,
		socialImageAlt: input.socialImageAlt ?? input.social?.alt ?? `${brand.fullName} documentation.`,
		glossaryEntries: clone(glossary.entries ?? []),
		glossarySkip: clone(glossary.skip ?? []),
		glossaryRoute: glossary.route === false ? false : String(glossary.route ?? 'glossary').replace(/^\/+|\/+$/g, ''),
		tutor: {
			enabled: tutor.enabled === true,
			title: tutor.title ?? 'Study this article with an AI assistant',
			intro: tutor.intro ?? 'Help me understand this article.',
		},
		rawMarkdown: { enabled: rawMarkdown.enabled === true },
		diagramDirectory: normalizeDirectory(diagrams.directory, input.root),
		starlight,
	};
}

/** Return only data that can safely cross the per-consumer virtual module. */
export function serializableConfig(config) {
	return {
		base: config.base,
		brand: config.brand,
		sidebarWidth: config.sidebarWidth,
		callouts: config.callouts,
		plannedTopics: config.plannedTopics,
		plannedTopLevel: config.plannedTopLevel,
		searchSuggestions: config.searchSuggestions,
		footer: config.footer,
		socialImage: config.socialImage,
		socialImageAlt: config.socialImageAlt,
		glossaryEntries: config.glossaryEntries,
		glossarySkip: config.glossarySkip,
		glossaryRoute: config.glossaryRoute,
		tutor: config.tutor,
		rawMarkdown: config.rawMarkdown,
	};
}
