import { articleKey } from './reading-state.mjs';

/** A separate record keeps section progress independent of read status and favorites. */
export function createPositionStore(storage, projectKey, article) {
	const key = `tech0ver:position:${encodeURIComponent(projectKey)}:${encodeURIComponent(article)}`;
	return {
		get() {
			try {
				const record = JSON.parse(storage?.getItem(key) ?? 'null');
				return record?.version === 1 && typeof record.section === 'string' ? record.section : null;
			} catch { return null; }
		},
		set(section) {
			try {
				if (section) storage?.setItem(key, JSON.stringify({ version: 1, section }));
				else storage?.removeItem(key);
			} catch { /* Reading remains usable when storage is blocked or full. */ }
		},
	};
}

export function fragmentId(hash) {
	try { return decodeURIComponent(hash.replace(/^#/, '')); }
	catch { return null; }
}

/** Ignoring a section also ignores its children until the next peer heading. */
export function ignoredHeadingIds(headings, ids) {
	const ignored = new Set(['_top']);
	const configured = new Set(ids);
	let level = Infinity;
	for (const heading of headings) {
		const depth = Number(heading.tagName.slice(1));
		if (depth <= level) level = Infinity;
		if (configured.has(heading.id)) level = Math.min(level, depth);
		if (level !== Infinity) ignored.add(heading.id);
	}
	return ignored;
}

/** Initialize once per page, and return cleanup for client-side navigation. */
export async function trackReadingPosition(config, signal) {
	if (!config.reading.position.enabled || !document.querySelector('[data-reading-position]')) return;
	const article = articleKey(location.href, config.base, location.origin);
	if (!article) return;
	const headings = [...document.querySelectorAll('.sl-markdown-content :is(h2,h3,h4,h5,h6)[id]')];
	if (!headings.length) return;
	const ignored = ignoredHeadingIds(headings, config.reading.position.ignoreSections);
	const byId = new Map(headings.map((heading) => [heading.id, heading]));
	let storage;
	try { storage = localStorage; } catch { /* No persistence when storage is blocked. */ }
	const store = createPositionStore(storage, config.reading.storageKey, article);
	const save = (id) => store.set(id && byId.has(id) && !ignored.has(id) ? id : null);

	// Explicit fragments always take priority, including #_top and unknown anchors.
	const initialHash = location.hash;
	let anchorTarget = fragmentId(initialHash);
	const saved = initialHash ? null : store.get();
	if (initialHash) save(fragmentId(initialHash));
	else if (saved && (!byId.has(saved) || ignored.has(saved))) store.set(null);

	await document.fonts.ready;
	if (signal?.aborted || !headings[0].isConnected) return;
	if (!initialHash && saved && byId.has(saved) && !ignored.has(saved) && !location.hash) {
		const url = new URL(location.href);
		url.hash = saved;
		history.replaceState(history.state, '', url);
		byId.get(saved).scrollIntoView({ behavior: 'instant' });
		anchorTarget = saved;
	}

	let timeout;
	const update = () => {
		const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
		const target = byId.get(anchorTarget);
		if (target) {
			const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
			const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
			const targetY = Math.max(0, Math.min(max, target.getBoundingClientRect().top + scrollY - padding - margin));
			// An anchor near the end may not reach the top because scrolling is clamped.
			if (Math.abs(scrollY - targetY) <= 3) { save(anchorTarget); return; }
		}
		anchorTarget = null;
		let current = null;
		const atEnd = scrollY > 0 && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2;
		for (const heading of headings) {
			const margin = parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
			const threshold = atEnd ? innerHeight : padding + margin + 2;
			if (heading.getBoundingClientRect().top > threshold) break;
			current = heading.id;
		}
		save(current);
		const url = new URL(location.href);
		url.hash = current ?? '';
		if (url.href !== location.href) history.replaceState(history.state, '', url);
	};
	const onScroll = () => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = undefined;
			update();
		}, 150);
	};
	const onHashChange = () => {
		clearTimeout(timeout);
		timeout = undefined;
		anchorTarget = fragmentId(location.hash);
		save(anchorTarget);
	};
	// Clicking the same anchor does not emit hashchange; it must still clear/save.
	const onClick = (event) => {
		const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
		if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
		const url = new URL(link.href, location.href);
		if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && link.getAttribute('href').includes('#')) {
			anchorTarget = fragmentId(url.hash);
			save(anchorTarget);
		}
	};
	const onPageHide = () => {
		if (timeout !== undefined) { clearTimeout(timeout); timeout = undefined; update(); }
	};
	window.addEventListener('scroll', onScroll, { passive: true, signal });
	window.addEventListener('hashchange', onHashChange, { signal });
	window.addEventListener('pagehide', onPageHide, { signal });
	document.addEventListener('click', onClick, { signal });
	signal?.addEventListener('abort', () => clearTimeout(timeout), { once: true });
	return () => {
		clearTimeout(timeout);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('hashchange', onHashChange);
		window.removeEventListener('pagehide', onPageHide);
		document.removeEventListener('click', onClick);
	};
}
