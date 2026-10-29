import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPositionStore, fragmentId, ignoredHeadingIds } from '../packages/starlight/src/lib/reading-position.mjs';
import { normalizeTech0verOptions } from '../packages/starlight/src/config.mjs';

const storage = () => {
	const data = new Map();
	return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
};

test('section progress persists per project and article, and clearing removes the record', () => {
	const disk = storage();
	const store = createPositionStore(disk, 'site', 'guide');
	store.set('first-section');
	assert.equal(createPositionStore(disk, 'site', 'guide').get(), 'first-section');
	assert.equal(createPositionStore(disk, 'other-site', 'guide').get(), null);
	assert.equal(createPositionStore(disk, 'site', 'other-guide').get(), null);
	store.set(null);
	assert.equal(store.get(), null);
	assert.equal(disk.data.size, 0);
});

test('section progress tolerates blocked storage and damaged records', () => {
	for (const disk of [undefined, { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('blocked'); } }]) {
		const store = createPositionStore(disk, 'site', 'guide');
		assert.equal(store.get(), null);
		assert.doesNotThrow(() => { store.set('section'); store.set(null); });
	}
	const disk = storage();
	const store = createPositionStore(disk, 'site', 'guide');
	store.set('section');
	const key = [...disk.data.keys()][0];
	for (const raw of ['{', 'null', '[]', '{"version":2,"section":"section"}', '{"version":1,"section":4}']) {
		disk.data.set(key, raw);
		assert.equal(store.get(), null);
	}
});

test('ignored sections include descendants, but stop at the next peer or parent', () => {
	const heading = (id, depth) => ({ id, tagName: `H${depth}` });
	const headings = [heading('intro', 2), heading('reference', 2), heading('detail', 3), heading('nested', 4), heading('next', 2), heading('skip', 3), heading('child', 4), heading('peer', 3)];
	assert.deepEqual([...ignoredHeadingIds(headings, ['reference', 'skip'])], ['_top', 'reference', 'detail', 'nested', 'skip', 'child']);
	assert.deepEqual([...ignoredHeadingIds(headings, ['reference', 'detail', 'skip'])], ['_top', 'reference', 'detail', 'nested', 'skip', 'child']);
	assert.equal(fragmentId('#%D1%82%D0%B5%D1%81%D1%82'), 'тест');
	assert.equal(fragmentId('#%broken'), null);
});

test('position defaults and overrides are independent of article status controls', () => {
	const defaults = normalizeTech0verOptions({ reading: { enabled: false } });
	assert.deepEqual(defaults.reading.position, { enabled: true, ignoreSections: [] });
	const ids = ['cheat-sheet'];
	const config = normalizeTech0verOptions({ reading: { position: { enabled: false, ignoreSections: ids } } });
	assert.equal(config.reading.enabled, true);
	assert.equal(config.reading.position.enabled, false);
	config.reading.position.ignoreSections.push('another');
	assert.deepEqual(ids, ['cheat-sheet']);
});

test('invalid position settings report the setting and offending array index', () => {
	for (const [position, path] of [
		[null, 'reading.position'],
		[[], 'reading.position'],
		[{ enabled: 'false' }, 'reading.position.enabled'],
		[{ ignoreSections: 'reference' }, 'reading.position.ignoreSections'],
		[{ ignoreSections: ['valid', '#reference'] }, 'reading.position.ignoreSections[1]'],
		[{ ignoreSections: [''] }, 'reading.position.ignoreSections[0]'],
		[{ ignoreSections: [42] }, 'reading.position.ignoreSections[0]'],
	]) {
		assert.throws(() => normalizeTech0verOptions({ reading: { position } }), (error) => error.message.startsWith(`${path} `), path);
	}
});
