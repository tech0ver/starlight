import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeTech0verOptions } from '../packages/starlight/src/config.mjs';

test('resolves the GitHub star target without requiring a new option', () => {
	assert.equal(normalizeTech0verOptions({ githubRepository: 'sysdes' }).githubRepository, 'https://github.com/tech0ver/sysdes');
	assert.equal(normalizeTech0verOptions({ githubRepository: 'other/project' }).githubRepository, 'https://github.com/other/project');
	assert.equal(normalizeTech0verOptions({ site: 'https://tech0ver.github.io', base: '/sysdes/' }).githubRepository, 'https://github.com/tech0ver/sysdes');
	assert.equal(normalizeTech0verOptions({ footer: { links: [{ href: 'https://github.com/org/repo', label: 'Repository' }] } }).githubRepository, 'https://github.com/org/repo');
	assert.equal(normalizeTech0verOptions({ githubRepository: false, site: 'https://tech0ver.github.io', base: '/sysdes' }).githubRepository, undefined);
	assert.equal(normalizeTech0verOptions({ site: 'https://example.com' }).githubRepository, undefined);
	assert.throws(() => normalizeTech0verOptions({ githubRepository: '../repo' }), /githubRepository/);
});

const term = { id: 'example', term: 'Example', short: 'Short meaning.', explanation: 'More detail.' };

test('invalid package data reports the setting and offending array index', () => {
	for (const [input, path] of [
		[{ glossary: { entries: [term, term] } }, 'glossary.entries[1].id'],
		[{ glossary: { entries: [{ ...term, short: '' }] } }, 'glossary.entries[0].short'],
		[{ glossary: { entries: [{ ...term, id: 'bad id' }] } }, 'glossary.entries[0].id'],
		[{ glossary: { entries: [{ ...term, aliases: 'example' }] } }, 'glossary.entries[0].aliases'],
		[{ glossary: { entries: [{ ...term, readMore: { href: 'https://', label: 'More' } }] } }, 'glossary.entries[0].readMore.href'],
		[{ searchSuggestions: [{ href: 'guide' }] }, 'searchSuggestions[0].label'],
		[{ footer: { links: [{ href: 'javascript:alert(1)', label: 'Bad' }] } }, 'footer.links[0].href'],
		[{ plannedTopics: { Docs: [{ label: 'Future' }] } }, 'plannedTopics.Docs[0].slug'],
		[{ reading: { labels: { read: 1 } } }, 'reading.labels.read'],
		[{ glossary: [] }, 'glossary'],
		[{ rawMarkdown: { enabled: 'true' } }, 'rawMarkdown.enabled'],
	]) {
		assert.throws(() => normalizeTech0verOptions(input), (error) => error.message.startsWith(`${path} `), path);
	}
});

test('valid Unicode content, relative links, defaults, and extension hooks remain supported', () => {
	const hook = () => {};
	const plugin = { name: 'consumer', hooks: { 'config:setup': hook } };
	const options = normalizeTech0verOptions({
		glossary: { entries: [{ ...term, id: 'пример', readMore: { href: '../guide/#пример', label: 'More' } }] },
		searchSuggestions: [{ href: 'https://example.test/search?q=one#two', label: 'Search' }],
		footer: { text: '', links: [{ href: '/contact', label: 'Contact' }, { href: 'mailto:reader@example.test', label: 'Email' }, { href: 'tel:+123456789', label: 'Call' }] },
		starlight: { plugins: [plugin], components: { Sidebar: '/custom/Sidebar.astro' } },
	});
	assert.equal(options.starlight.plugins[0].hooks['config:setup'], hook);
	assert.equal(options.starlight.components.Sidebar, '/custom/Sidebar.astro');
	assert.equal(options.glossaryEntries[0].id, 'пример');
});
