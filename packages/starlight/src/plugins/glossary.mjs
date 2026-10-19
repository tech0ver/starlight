// Sätteri hast plugin: wraps the first mention of each configured glossary term.
// Text inside links, code, headings, and the glossary page stays untouched.

import { fileURLToPath } from 'node:url';

const SKIP_TAGS = new Set(['a', 'code', 'pre', 'kbd', 'script', 'style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

const escapeHtml = (value) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function pageSlug(fileURL) {
	if (!fileURL) return undefined;
	const path = fileURLToPath(fileURL).replace(/\\/g, '/');
	const match = path.match(/\/src\/content\/docs\/(.+)\.mdx?$/);
	if (!match) return undefined;
	return match[1].replace(/(^|\/)index$/, '');
}

function readMoreSlug(href) {
	if (/^[a-z]+:\/\//i.test(href)) return undefined;
	return href.split('#')[0].replace(/^\/+|\/+$/g, '');
}

export function glossaryPlugin({ entries = [], skip = [], base = '/', route = 'glossary' } = {}) {
	const root = base.endsWith('/') ? base : `${base}/`;
	const byAlias = new Map();
	for (const entry of entries) {
		const lowerFirst = entry.term ? entry.term[0].toLowerCase() + entry.term.slice(1) : '';
		for (const alias of entry.aliases ?? [entry.term, lowerFirst]) {
			if (alias) byAlias.set(alias, entry);
		}
	}
	for (const phrase of skip) {
		if (phrase) byAlias.set(phrase, null);
	}
	const aliases = [...byAlias.keys()].sort((a, b) => b.length - a.length);
	// An empty glossary must remain a no-op. RegExp('()') would otherwise match
	// every position and can make a page grow forever while it is transformed.
	const pattern = aliases.length
		? new RegExp(`(?<![\\w/.-])(${aliases.map(escapeRegExp).join('|')})(?![\\w/-])`, 'g')
		: null;

	const readMoreLink = (readMore) => {
		if (!readMore) return '';
		const external = /^[a-z]+:\/\//i.test(readMore.href);
		const href = external ? readMore.href : `${root}${readMore.href.replace(/^\/+/, '')}`;
		const attrs = external ? ' target="_blank" rel="noopener"' : '';
		return `<span class="term-tip-more">Read more: <a href="${escapeHtml(href)}"${attrs}>${escapeHtml(readMore.label)}</a></span>`;
	};

	const tooltip = (entry, text) => {
		const tipId = `term-tip-${entry.id}`;
		const name = `<span class="term-tip-name">${escapeHtml(entry.expansion ?? entry.term)}</span>`;
		return (
			`<span class="term" tabindex="0" aria-describedby="${tipId}">` +
			`<span class="term-label">${escapeHtml(text)}</span>` +
			`<span class="term-tip" role="tooltip" id="${tipId}"><span class="term-tip-card">` +
			`${name}<span class="term-tip-text">${escapeHtml(entry.short)} ${escapeHtml(entry.explanation)}</span>` +
			`${readMoreLink(entry.readMore)}</span></span></span>`
		);
	};

	return (factoryCtx) => {
		const slug = pageSlug(factoryCtx.fileURL);
		if (slug === undefined || slug === route || !pattern) return null;
		const used = new Set(
			entries
				.filter((entry) => (entry.readMore && readMoreSlug(entry.readMore.href) === slug) || entry.explainedIn?.includes(slug))
				.map((entry) => entry.id),
		);

		return {
			name: 'tech0ver-glossary',
			text(node, ctx) {
				for (let parent = ctx.parent(node); parent; parent = ctx.parent(parent)) {
					if (parent.type === 'element' && SKIP_TAGS.has(parent.tagName)) return;
				}
				const parts = [];
				let last = 0;
				pattern.lastIndex = 0;
				for (let match; (match = pattern.exec(node.value)); ) {
					const entry = byAlias.get(match[1]);
					if (!entry || used.has(entry.id)) continue;
					used.add(entry.id);
					if (match.index > last) parts.push({ type: 'text', value: node.value.slice(last, match.index) });
					parts.push({ type: 'raw', value: tooltip(entry, match[1]) });
					last = match.index + match[1].length;
				}
				if (parts.length === 0) return;
				if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
				ctx.replaceNode(node, parts);
			},
		};
	};
}
