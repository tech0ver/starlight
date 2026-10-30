import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { normalizeTech0verOptions } from '../packages/starlight/src/config.mjs';
import { createConfigVirtualModule } from '../packages/starlight/src/integration.mjs';
import { articleMarkdown } from '../packages/starlight/src/lib/article-markdown.mjs';
import { glossaryPlugin } from '../packages/starlight/src/plugins/glossary.mjs';
import { blocksPlugin } from '../packages/starlight/src/plugins/blocks.mjs';
import { diagramsPlugin } from '../packages/starlight/src/plugins/diagrams.mjs';
import { readingPlugin } from '../packages/starlight/src/plugins/reading.mjs';

const entry = {
	id: 'callout',
	term: 'Callout',
	short: 'A styled block of guidance.',
	explanation: 'It highlights a useful point in an article.',
};

test('reading markers become explicit slots without consuming other directives', () => {
	const replacements = [];
	const ctx = { replaceNode(_node, value) { replacements.push(value.raw); } };
	readingPlugin().leafDirective({ name: 'mark-as-read' }, ctx);
	readingPlugin().leafDirective({ name: 'diagram' }, ctx);
	assert.deepEqual(replacements, ['<div class="not-content" data-mark-read-slot hidden></div>']);
});

test('raw Markdown omits reading controls while preserving code examples', () => {
	const output = articleMarkdown({
		title: 'Reading',
		body: 'Before\n\n::mark-as-read\n\n## Reference\n\n```md\n::mark-as-read\n```\n\nAfter\n\n::mark-as-read',
		articleUrl: new URL('https://example.test/reading/'),
		siteRoot: new URL('https://example.test/'),
	});
	assert.equal(output.match(/::mark-as-read/g)?.length, 1);
	assert.match(output, /```md\n::mark-as-read\n```/);
	assert.match(output, /Before[\s\S]*## Reference[\s\S]*After/);
});

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
	const plannedTopLevel = ['Future guide'];
	const first = normalizeTech0verOptions({ brand: { name: 'First' }, glossary: { entries: [entry] }, plannedTopLevel, sidebarWidth: 256 });
	const second = normalizeTech0verOptions({ brand: { name: 'Second' }, glossary: { entries: [entry] }, plannedTopLevel });
	first.glossaryEntries[0].term = 'Changed';
	first.plannedTopLevel.push('Another guide');
	assert.equal(second.glossaryEntries[0].term, 'Callout');
	assert.deepEqual(second.plannedTopLevel, ['Future guide']);
	assert.deepEqual(plannedTopLevel, ['Future guide']);
	const firstModule = createConfigVirtualModule(first);
	const secondModule = createConfigVirtualModule(second);
	assert.match(firstModule.load('\0virtual:tech0ver/config'), /First/);
	assert.match(secondModule.load('\0virtual:tech0ver/config'), /Second/);
	assert.notEqual(firstModule.load('\0virtual:tech0ver/config'), secondModule.load('\0virtual:tech0ver/config'));
	assert.match(firstModule.load('\0virtual:tech0ver/config'), /"plannedTopLevel":\["Future guide","Another guide"\]/);
	assert.match(firstModule.load('\0virtual:tech0ver/layout.css'), /--site-left-sidebar-width: 256px/);
	assert.match(secondModule.load('\0virtual:tech0ver/layout.css'), /--site-left-sidebar-width: 200px/);
});

test('sidebar width accepts positive pixel values and rejects invalid CSS input', () => {
	assert.equal(normalizeTech0verOptions({ sidebarWidth: 240.5 }).sidebarWidth, 240.5);
	for (const sidebarWidth of [0, -1, NaN, Infinity, '256px', '200px; color: red']) {
		assert.throws(() => normalizeTech0verOptions({ sidebarWidth }), /positive number of pixels/);
	}
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

test('compact diagrams keep the text scale of the 720-unit reference grid', () => {
	const directory = mkdtempSync(join(tmpdir(), 'starlight-diagrams-'));
	try {
		const plugin = diagramsPlugin({ directory: pathToFileURL(`${directory}/`) });
		for (const viewBox of ['0 0 360 120', '-10, -20, 360.0, 120', '0 0 720 120', '0 0 900 120']) {
			writeFileSync(join(directory, 'flow.svg'), `<svg viewBox="${viewBox}"><text>Consumer</text></svg>`);
			let rendered;
			plugin.leafDirective({ name: 'diagram', attributes: { name: 'flow' } }, {
				replaceNode(_node, value) { rendered = value.raw; },
			});
			if (viewBox.includes('360')) {
				assert.match(rendered, /width: 50\.00%; min-width: 300px/);
			} else {
				assert.doesNotMatch(rendered, /style=/);
			}
			assert.ok(rendered.includes(`viewBox="${viewBox}"`));
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
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

test('board diagrams keep the final caption visible without JavaScript and validate captions', () => {
	const directory = mkdtempSync(join(tmpdir(), 'starlight-board-'));
	try {
		const plugin = diagramsPlugin({ directory: pathToFileURL(`${directory}/`) });
		writeFileSync(join(directory, 'board.svg'), `<svg class="sk-svg" viewBox="0 0 720 200" data-steps='["First &amp; next", "Second"]' data-final="Whole &amp; complete"><g class="sk-el" data-step="1"/></svg>`);
		let result;
		plugin.leafDirective({ name: 'diagram', attributes: { name: 'board' } }, { replaceNode(_node, replacement) { result = replacement.raw; } });
		assert.match(result, /class="sk-scroll" tabindex="0"/);
		assert.match(result, /aria-live="polite">Whole &amp; complete<\/figcaption>/);
		assert.match(result, /class="sk-controls" hidden/);
		writeFileSync(join(directory, 'board.svg'), `<svg class="sk-svg" data-steps='[]' data-final="Whole"></svg>`);
		assert.throws(() => plugin.leafDirective({ name: 'diagram', attributes: { name: 'board' } }, { replaceNode() {} }), /non-empty step captions/);
	} finally { rmSync(directory, { recursive: true, force: true }); }
});
