import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { normalizeTech0verOptions } from '../packages/starlight/src/config.mjs';
import { createConfigVirtualModule } from '../packages/starlight/src/integration.mjs';
import { articleMarkdown } from '../packages/starlight/src/lib/article-markdown.mjs';
import { glossaryPlugin } from '../packages/starlight/src/plugins/glossary.mjs';
import { blocksPlugin } from '../packages/starlight/src/plugins/blocks.mjs';

const entry = {
	id: 'callout',
	term: 'Callout',
	short: 'A styled block of guidance.',
	explanation: 'It highlights a useful point in an article.',
};

test('an empty glossary is a no-op', () => {
	const plugin = glossaryPlugin({ entries: [] });
	assert.equal(plugin({ fileURL: pathToFileURL('/tmp/src/content/docs/reading.md') }), null);
});

test('glossary wraps only the first configured mention', () => {
	const factory = glossaryPlugin({ entries: [entry], base: '/demo', route: 'glossary' });
	const transformer = factory({ fileURL: pathToFileURL('/tmp/src/content/docs/reading.md') });
	const replacements = [];
	transformer.text(
		{ type: 'text', value: 'A Callout and another Callout.' },
		{ parent: () => null, replaceNode: (_node, parts) => replacements.push(parts) },
	);
	assert.equal(replacements.length, 1);
	assert.equal(replacements[0].filter((part) => part.type === 'raw').length, 1);
	assert.match(replacements[0][1].value, /term-tip-callout/);
});

test('each config owns its data and virtual module', () => {
	const first = normalizeTech0verOptions({ brand: { name: 'First' }, glossary: { entries: [entry] } });
	const second = normalizeTech0verOptions({ brand: { name: 'Second' }, glossary: { entries: [entry] } });
	first.glossaryEntries[0].term = 'Changed';
	assert.equal(second.glossaryEntries[0].term, 'Callout');
	const firstModule = createConfigVirtualModule(first);
	const secondModule = createConfigVirtualModule(second);
	assert.match(firstModule.load('\0virtual:tech0ver/config'), /First/);
	assert.match(secondModule.load('\0virtual:tech0ver/config'), /Second/);
	assert.notEqual(firstModule.load('\0virtual:tech0ver/config'), secondModule.load('\0virtual:tech0ver/config'));
});

test('relative diagram directories belong to the consumer root', () => {
	const config = normalizeTech0verOptions({
		root: '/tmp/tech0ver-consumer',
		diagrams: { directory: './src/diagrams' },
	});
	assert.equal(config.diagramDirectory.href, 'file:///tmp/tech0ver-consumer/src/diagrams/');
	const urlConfig = normalizeTech0verOptions({ diagrams: { directory: new URL('file:///tmp/tech0ver-url/diagrams') } });
	assert.equal(urlConfig.diagramDirectory.href, 'file:///tmp/tech0ver-url/diagrams/');
});

test('callout labels are local to a consumer and keep their semantic classes', () => {
	const first = normalizeTech0verOptions({ callouts: { do: 'Try this' } });
	const second = normalizeTech0verOptions({});
	assert.equal(first.callouts.do, 'Try this');
	assert.equal(first.callouts.avoid, 'Avoid');
	assert.equal(second.callouts.do, 'What to do');
	const node = { name: 'do' };
	blocksPlugin(first.callouts).containerDirective(node, {
		setProperty(target, key, value) { target[key] = value; },
	});
	assert.deepEqual(node.data.hProperties, {
		className: ['block', 'block-do'], 'data-label': 'Try this',
	});
	assert.match(createConfigVirtualModule(first).load('\0virtual:tech0ver/config'), /Try this/);
	assert.doesNotMatch(createConfigVirtualModule(second).load('\0virtual:tech0ver/config'), /Try this/);
});

test('raw Markdown export expands callouts and keeps links useful', () => {
	const markdown = articleMarkdown({
		title: 'Reading',
		description: 'A test article.',
		body: 'Before [the next page](../next/)\n\n:::do\nUse the shared layout.\n:::\n\n::diagram{name="layout"}',
		articleUrl: new URL('https://example.test/demo/reading/'),
		siteRoot: new URL('https://example.test/demo/'),
	});
	assert.match(markdown, /> \*\*What to do\*\*/);
	assert.match(markdown, /https:\/\/example\.test\/demo\/next\//);
	assert.doesNotMatch(markdown, /::diagram\{|name="layout"/);
});

test('raw Markdown uses consumer callout labels with defaults for other kinds', () => {
	const markdown = articleMarkdown({
		title: 'Reading',
		body: ':::do\nUse the shared layout.\n:::\n\n:::explain\nLabels use shared colors.\n:::\n\n:::avoid\nDo not duplicate styles.\n:::',
		callouts: { do: 'Try this', explain: 'How it works' },
		articleUrl: new URL('https://example.test/reading/'),
		siteRoot: new URL('https://example.test/'),
	});
	assert.match(markdown, /> \*\*Try this\*\*/);
	assert.match(markdown, /> \*\*How it works\*\*/);
	assert.match(markdown, /> \*\*Avoid\*\*/);
});
