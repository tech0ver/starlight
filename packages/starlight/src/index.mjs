import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import { normalizeTech0verOptions, packagePaths } from './config.mjs';
import { createConfigVirtualModule, createRawMarkdownIntegration, createTech0verPlugin } from './integration.mjs';
import { blocksPlugin } from './plugins/blocks.mjs';
import { diagramsPlugin } from './plugins/diagrams.mjs';
import { glossaryPlugin } from './plugins/glossary.mjs';

/**
 * Create an Astro config with the shared Tech0ver presentation and a
 * project-specific Starlight configuration.
 *
 * The function is deliberately a factory: all consumer data is captured by
 * the returned config and virtual modules, never by a process-wide singleton.
 */
export function defineTech0verConfig(input = {}) {
	const normalized = normalizeTech0verOptions(input);
	const {
		brand: _brand,
		callouts: _callouts,
		title: _title,
		plannedTopics: _plannedTopics,
		searchSuggestions: _searchSuggestions,
		search: _search,
		footer: _footer,
		socialImage: _socialImage,
		socialImageAlt: _socialImageAlt,
		social: _social,
		// Ignore the removed local-preview option rather than forward it to Astro.
		palette: _removedPalette,
		glossary: _glossary,
		diagrams: _diagrams,
		tutor: _tutor,
		rawMarkdown: _rawMarkdown,
		starlight: _starlight,
		base: _base,
		mdastPlugins: userMdastPlugins = [],
		hastPlugins: userHastPlugins = [],
		...astroOptions
	} = input;

	const userStarlight = normalized.starlight;
	const starlightConfig = {
		title: normalized.brand.fullName,
		...userStarlight,
		favicon: '/favicon.png',
		customCss: [...packagePaths.styles, ...(userStarlight.customCss ?? [])],
		components: { ...packagePaths.components, ...(userStarlight.components ?? {}) },
		plugins: [createTech0verPlugin(normalized), ...(userStarlight.plugins ?? [])],
	};

	const markdownOptions = astroOptions.markdown ?? {};
	const processor = satteri({
		mdastPlugins: [
			blocksPlugin(normalized.callouts),
			diagramsPlugin({ directory: normalized.diagramDirectory }),
			...userMdastPlugins,
			...(markdownOptions.mdastPlugins ?? []),
		],
		hastPlugins: [
			glossaryPlugin({
				entries: normalized.glossaryEntries,
				skip: normalized.glossarySkip,
				base: normalized.base,
				route: normalized.glossaryRoute || 'glossary',
			}),
			...userHastPlugins,
			...(markdownOptions.hastPlugins ?? []),
		],
		features: markdownOptions.features,
	});

	const integrations = [...(astroOptions.integrations ?? [])];
	if (normalized.rawMarkdown.enabled) {
		integrations.push(createRawMarkdownIntegration(packagePaths.rawMarkdown));
	}
	integrations.push(starlight(starlightConfig));

	return defineConfig({
		...astroOptions,
		base: normalized.base,
		markdown: { ...markdownOptions, processor },
		vite: {
			...(astroOptions.vite ?? {}),
			plugins: [...(astroOptions.vite?.plugins ?? []), createConfigVirtualModule(normalized)],
		},
		integrations,
	});
}

export { normalizeTech0verOptions } from './config.mjs';
export { blocksPlugin } from './plugins/blocks.mjs';
export { diagramsPlugin } from './plugins/diagrams.mjs';
export { glossaryPlugin } from './plugins/glossary.mjs';
export { articleMarkdown } from './lib/article-markdown.mjs';
