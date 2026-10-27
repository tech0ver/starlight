/** Stable article paths without the site's base, query, or fragment. */
export function articleKey(href, base = '/', origin = 'https://reading.invalid') {
	try {
		const url = new URL(href, `${origin}${base.replace(/\/$/, '')}/`);
		if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return null;
		const prefix = base.replace(/\/$/, '');
		if (!url.pathname.startsWith(`${prefix}/`)) return null;
		const path = url.pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
		return path ? decodeURIComponent(path) : null;
	} catch {
		return null;
	}
}

const emptyState = () => ({ status: 'new', favorite: false });

/** Resolve the current nested sidebar article for controls in Markdown and MDX. */
export function currentArticleKey(sidebar, base, origin, nested = false) {
	for (const item of sidebar) {
		if (item.type === 'group') {
			const key = currentArticleKey(item.entries, base, origin, true);
			if (key) return key;
		} else if (nested && item.isCurrent) {
			return articleKey(item.href, base, origin);
		}
	}
	return null;
}

/** One record per article avoids overwriting other articles changed in another tab. */
export function createReadingStore(storage, projectKey) {
	const prefix = `tech0ver:reading:${encodeURIComponent(projectKey)}:`;
	const memory = new Map();
	const unsaved = new Set();
	let readable = Boolean(storage);
	let writable = Boolean(storage);
	const key = (article) => `${prefix}${encodeURIComponent(article)}`;
	function get(article) {
		if (!readable || unsaved.has(article)) return memory.get(article) ?? emptyState();
		let raw;
		try {
			raw = storage.getItem(key(article));
		} catch {
			readable = false;
			return memory.get(article) ?? emptyState();
		}
		let state = emptyState();
		try {
			const record = JSON.parse(raw);
			if (record?.version === 1) {
				state = {
					status: ['seen', 'read'].includes(record.status) ? record.status : 'new',
					favorite: record.favorite === true,
				};
			}
		} catch { /* A damaged record does not affect the other articles. */ }
		memory.set(article, state);
		return state;
	}
	function update(article, change) {
		const state = { ...get(article), ...change };
		memory.set(article, state);
		unsaved.add(article);
		if (writable) {
			try {
				storage.setItem(key(article), JSON.stringify({ version: 1, ...state }));
				unsaved.delete(article);
			} catch { writable = false; }
		}
		return state;
	}
	return { get, update, ownsKey: (value) => value === null || value.startsWith(prefix) };
}
