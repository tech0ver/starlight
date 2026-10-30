import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import config from 'virtual:tech0ver/config';
import starlight from 'virtual:starlight/user-config';
import { getSidebar } from 'virtual:tech0ver/sidebar';
import { llmsText } from '../lib/llms.mjs';

export const GET: APIRoute = async ({ site, url }) => {
	const entries = await getCollection('docs', (entry) => !entry.data.draft);
	const siteRoot = new URL(`${config.base.replace(/\/$/, '')}/`, site ?? url);
	const locales = Object.entries(starlight.locales ?? { root: { label: '' } });
	const sidebar = locales.flatMap(([locale, settings]) => {
		const entries = getSidebar(url.pathname, locale === 'root' ? undefined : locale);
		return locales.length > 1 ? [{ type: 'group', label: settings.label, entries }] : entries;
	});
	return new Response(llmsText({
		title: config.brand.fullName,
		description: config.siteDescription,
		entries,
		sidebar,
		siteRoot,
		glossaryRoute: config.glossaryRoute,
		htmlUrls: config.htmlUrls,
	}), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
