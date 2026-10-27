import assert from 'node:assert/strict';
import { test } from 'node:test';
import { articleKey, currentArticleKey, createReadingStore } from '../packages/starlight/src/lib/reading-state.mjs';
import { normalizeTech0verOptions } from '../packages/starlight/src/config.mjs';
import { createConfigVirtualModule } from '../packages/starlight/src/integration.mjs';

function storage() {
	const data = new Map();
	return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('article keys survive base changes and ignore URL-only differences', () => {
	for (const href of ['/docs/guide/', '/docs/guide', '/docs/guide/?mode=1#section']) {
		assert.equal(articleKey(href, '/docs'), 'guide');
	}
	assert.equal(articleKey('/guide/', '/'), articleKey('/docs/guide/', '/docs'));
	assert.equal(articleKey('/docs/%D1%82%D0%B5%D1%81%D1%82/', '/docs'), 'тест');
	assert.equal(articleKey('/docs/тест/', '/docs'), 'тест');
	assert.equal(articleKey('guide/', '/docs'), 'guide');
	assert.equal(articleKey('/docs/nested/guide/', '/docs'), 'nested/guide');
	for (const href of ['/docs/', '/elsewhere/guide', '/docs-other/guide', 'https://external.test/docs/guide', 'mailto:a@example.test', '/docs/%broken']) {
		assert.equal(articleKey(href, '/docs'), null);
	}
});

test('project keys isolate status and favorites, and new clients retain saved records', () => {
	const disk = storage();
	const first = createReadingStore(disk, 'first');
	const second = createReadingStore(disk, 'second');
	assert.deepEqual(first.get('guide'), { status: 'new', favorite: false });
	first.update('guide', { favorite: true });
	assert.deepEqual(first.get('guide'), { status: 'new', favorite: true });
	first.update('guide', { status: 'seen' });
	first.update('guide', { status: 'read' });
	assert.deepEqual(createReadingStore(disk, 'first').get('guide'), { status: 'read', favorite: true });
	assert.deepEqual(second.get('guide'), { status: 'new', favorite: false });
	first.update('guide', { status: 'seen' });
	assert.deepEqual(first.get('guide'), { status: 'seen', favorite: true });
	first.update('guide', { favorite: false });
	assert.deepEqual(first.get('guide'), { status: 'seen', favorite: false });
	assert.equal(createReadingStore(disk, 'first:extra').ownsKey([...disk.data.keys()][0]), false);
});

test('tabs read fresh state without losing changes to other articles or fields', () => {
	const disk = storage();
	const firstTab = createReadingStore(disk, 'project');
	const secondTab = createReadingStore(disk, 'project');
	firstTab.update('one', { status: 'read' });
	secondTab.update('two', { favorite: true });
	secondTab.update('one', { favorite: true });
	assert.deepEqual(firstTab.get('one'), { status: 'read', favorite: true });
	assert.deepEqual(firstTab.get('two'), { status: 'new', favorite: true });
	disk.data.clear();
	assert.deepEqual(firstTab.get('one'), { status: 'new', favorite: false });
});

test('damaged records do not erase other saved articles', () => {
	const disk = storage();
	const store = createReadingStore(disk, 'project');
	store.update('good', { status: 'read', favorite: true });
	store.update('bad', { status: 'seen' });
	const badKey = [...disk.data.keys()].find((key) => key.endsWith(':bad'));
	for (const value of ['{', 'null', '[]', '{"version":1,"status":"invalid","favorite":"true"}']) {
		disk.data.set(badKey, value);
		assert.deepEqual(store.get('bad'), { status: 'new', favorite: false });
		assert.deepEqual(store.get('good'), { status: 'read', favorite: true });
	}
});

test('unavailable or full storage leaves controls usable for the current page', () => {
	for (const disk of [undefined, { getItem() { throw new Error('blocked'); } }, { getItem() { return null; }, setItem() { throw new Error('full'); } }]) {
		const store = createReadingStore(disk, 'project');
		store.update('guide', { status: 'seen' });
		store.update('guide', { favorite: true });
		assert.deepEqual(store.get('guide'), { status: 'seen', favorite: true });
	}
});

test('a full store still reads saved marks while retaining unsaved changes', () => {
	const disk = storage();
	createReadingStore(disk, 'project').update('old', { status: 'read', favorite: true });
	disk.setItem = () => { throw new Error('full'); };
	const store = createReadingStore(disk, 'project');
	store.update('new', { status: 'seen' });
	assert.deepEqual(store.get('old'), { status: 'read', favorite: true });
	store.update('old', { favorite: false });
	assert.deepEqual(store.get('old'), { status: 'read', favorite: false });
	assert.deepEqual(store.get('new'), { status: 'seen', favorite: false });
});

test('reading config has stable defaults, isolated labels, and rejects empty keys', () => {
	const first = normalizeTech0verOptions({ base: '/first/', reading: { storageKey: 'first', labels: { markAsRead: 'Done' } } });
	const second = normalizeTech0verOptions({ base: '/second/' });
	assert.equal(first.reading.labels.markAsRead, 'Done');
	assert.equal(second.reading.labels.markAsRead, 'Mark as read');
	assert.equal(second.reading.storageKey, 'base:/second');
	assert.equal(normalizeTech0verOptions({ reading: { enabled: false } }).reading.enabled, false);
	assert.match(createConfigVirtualModule(first).load('\0virtual:tech0ver/config'), /"storageKey":"first"/);
	for (const storageKey of ['', ' ', 123]) assert.throws(() => normalizeTech0verOptions({ reading: { storageKey } }), /non-empty project key/);
});

test('buttons resolve nested articles and skip home, top-level, and external links', () => {
	const current = (href) => ({ type: 'link', href, isCurrent: true });
	const group = (entries) => ({ type: 'group', entries });
	assert.equal(currentArticleKey([current('/docs/guide/')], '/docs'), null);
	assert.equal(currentArticleKey([group([current('/docs/')])], '/docs'), null);
	assert.equal(currentArticleKey([group([current('https://external.test/docs/guide/')])], '/docs'), null);
	assert.equal(currentArticleKey([group([group([current('/docs/guide/')])])], '/docs'), 'guide');
});
