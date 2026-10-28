import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unwrittenTopics } from '../packages/starlight/src/lib/planned-topics.mjs';

const link = (label, href) => ({ type: 'link', label, href });
const group = (label, entries = []) => ({ type: 'group', label, entries });

test('planned slugs match links in the same list independently of labels and base', () => {
	for (const base of ['/', '/docs', '/docs/']) {
		const prefix = base.replace(/\/$/, '');
		const entries = [link('Rate limiting', `${prefix}/patterns/rate-limiting/`)];
		for (const slug of ['patterns/rate-limiting', '/patterns/rate-limiting/', 'patterns/rate-limiting/']) {
			assert.deepEqual(unwrittenTopics([{ label: 'Rate Limiting', slug }], entries, base), []);
		}
		assert.deepEqual(unwrittenTopics([{ label: 'Other', slug: 'other' }], entries, base), [{ label: 'Other', slug: 'other' }]);
	}
});

test('strings preserve label matching and objects only match direct internal links', () => {
	const entries = [link('Published', '/docs/page/'), group('Group', [link('Nested', '/docs/nested/')]), link('External', 'https://elsewhere.test/docs/external/')];
	const topics = ['Published', 'Group', 'published', { label: 'Published', slug: 'missing' }, { label: 'Nested', slug: 'nested' }, { label: 'External', slug: 'external' }];
	assert.deepEqual(unwrittenTopics(topics, entries, '/docs'), topics.slice(2));
	assert.deepEqual(unwrittenTopics([{ label: 'Anything', slug: 'page' }], entries, '/docs'), []);
	assert.deepEqual(unwrittenTopics([{ label: 'Nested', slug: 'nested' }], entries[1].entries, '/docs'), []);
});
