import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import config from 'virtual:tech0ver/config';
import { llmsText } from '../lib/llms.mjs';

export const GET: APIRoute = async ({ site, url }) => {
	const entries = await getCollection('docs', (entry) => !entry.data.draft);
	const siteRoot = new URL(`${config.base.replace(/\/$/, '')}/`, site ?? url);
	return new Response(llmsText({
		title: config.brand.fullName,
		description: config.siteDescription,
		entries,
		siteRoot,
		glossaryRoute: config.glossaryRoute,
		htmlUrls: config.htmlUrls,
	}), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
