import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import config from 'virtual:tech0ver/config';
import favicon from './assets/favicon.png';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const routeId = String(route.id ?? '').replace(/^\/+|\/+$/g, '');
	// The organization icon is a package asset. Astro adds the consumer base and
	// copies it into the build, so no per-project public favicon is needed.
	route.head = route.head.filter((item) => !(
		item.tag === 'link' && String(item.attrs?.rel ?? '').split(/\s+/).includes('icon')
	));
	route.head.push({ tag: 'link', attrs: { rel: 'icon', href: favicon.src, type: 'image/png' } });

	if (routeId === 'index' || routeId === '') {
		route.head = route.head.map((item) => {
			if (item.tag === 'title') return { ...item, content: route.siteTitle };
			if (item.tag === 'meta' && item.attrs?.property === 'og:title') {
				return { ...item, attrs: { ...item.attrs, content: route.siteTitle } };
			}
			return item;
		});
	}

	if (!config.glossaryRoute || routeId !== config.glossaryRoute) return;

	const entries = [...config.glossaryEntries].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
	route.toc = {
		minHeadingLevel: 2,
		maxHeadingLevel: 2,
		items: [
			{ depth: 2, slug: '_top', text: 'Overview', children: [] },
			...entries.map((entry) => ({ depth: 2, slug: entry.id, text: entry.term, children: [] })),
		],
	};
});
