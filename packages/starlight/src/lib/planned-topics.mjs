import { articleKey } from './reading-state.mjs';

/** Keep planned topics whose matching entry is absent from this sidebar list. */
export function unwrittenTopics(topics, entries, base, origin) {
	return topics.filter((topic) => {
		if (typeof topic === 'string') return !entries.some((entry) => entry.label === topic);
		const slug = topic.slug.replace(/^\/+|\/+$/g, '');
		const path = articleKey(`${base.replace(/\/$/, '')}/${slug}`, base, origin);
		return !path || !entries.some((entry) => entry.type === 'link' && articleKey(entry.href, base, origin) === path);
	});
}
