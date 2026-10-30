import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import config from 'virtual:tech0ver/config';
import { articleMarkdown } from '../lib/article-markdown.mjs';
import { hasMarkdownExport, markdownLinkTargets, pageUrl } from '../lib/llms.mjs';

export const getStaticPaths: GetStaticPaths = async () => {
	const articles = await getCollection('docs', (entry) => hasMarkdownExport(entry, config.glossaryRoute));
	return articles.map((entry) => ({ params: { article: entry.id }, props: { entry } }));
};

export const GET: APIRoute = async ({ props, site, url }) => {
	const entry = props.entry as CollectionEntry<'docs'>;
	const siteRoot = new URL(`${config.base.replace(/\/$/, '')}/`, site ?? url);
	const articleUrl = pageUrl(entry.id, siteRoot, config.htmlUrls);
	const entries = await getCollection('docs');
	return new Response(
		articleMarkdown({
			title: entry.data.title,
			description: entry.data.description,
			body: entry.body ?? '',
			renderedHtml: entry.rendered?.html,
			articleUrl,
			siteRoot,
			markdownUrls: markdownLinkTargets(entries, siteRoot, config.glossaryRoute, config.htmlUrls),
			glossary: config.glossaryEntries,
			callouts: config.callouts,
		}),
		{ headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
	);
};
