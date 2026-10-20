import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const versionPattern = '(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)';
const stableVersion = new RegExp(`^${versionPattern}$`);
const stableTag = new RegExp(`^v(${versionPattern})$`);

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function changelogEntries(content) {
	const heading = new RegExp(`^## (?:\\[(${versionPattern})\\](?:\\([^\\n]+\\))?|(${versionPattern}))(?: \\([^\\n]+\\))?\\s*$`, 'gm');
	const matches = [...content.matchAll(heading)];
	return matches.map((match, index) => ({
		version: match[1] || match[5],
		notes: content.slice(match.index + match[0].length, matches[index + 1]?.index ?? content.length).trim(),
	}));
}

export function validateRelease(root, tag) {
	const packageJson = readJson(join(root, 'packages/starlight/package.json'));
	assert.equal(packageJson.name, '@tech0ver/starlight', 'package name must remain @tech0ver/starlight');
	assert.match(packageJson.version, stableVersion, 'package version must be stable canonical semver');
	assert.equal(packageJson.publishConfig?.registry, 'https://npm.pkg.github.com', 'package registry must be GitHub Packages');

	const manifest = readJson(join(root, '.release-please-manifest.json'));
	assert.deepEqual(Object.keys(manifest), ['packages/starlight'], 'release manifest must contain only packages/starlight');
	assert.equal(manifest['packages/starlight'], packageJson.version, 'release manifest version must match the package');

	const lock = readFileSync(join(root, 'bun.lock'), 'utf8');
	assert.equal((lock.match(/x-release-please-version/g) || []).length, 1, 'bun.lock must contain one release version marker');
	const workspaceStart = lock.indexOf('"packages/starlight": {');
	assert.notEqual(workspaceStart, -1, 'bun.lock is missing the packages/starlight workspace');
	const workspaceEnd = lock.indexOf('\n    },', workspaceStart);
	assert.notEqual(workspaceEnd, -1, 'bun.lock packages/starlight workspace is malformed');
	const workspaceBlock = lock.slice(workspaceStart, workspaceEnd);
	const lockVersion = /^\s*"version": "([^"]+)",\s*\/\/ x-release-please-version\s*$/m.exec(workspaceBlock)?.[1];
	assert.ok(lockVersion, 'bun.lock workspace version must carry the release marker');
	assert.equal(lockVersion, packageJson.version, 'bun.lock workspace version must match the package');

	const changelog = readFileSync(join(root, 'packages/starlight/CHANGELOG.md'), 'utf8');
	const entries = changelogEntries(changelog);
	assert.ok(entries.length > 0, 'changelog must contain a release heading');
	assert.equal(entries[0].version, packageJson.version, 'latest changelog version must match the package');
	assert.ok(entries[0].notes, `changelog ${packageJson.version} must contain release notes`);

	if (tag !== undefined) {
		const match = stableTag.exec(tag);
		assert.ok(match, 'release tag must be v followed by stable canonical semver');
		assert.equal(match[1], packageJson.version, 'release tag version must match the package');
	}

	return packageJson.version;
}

const script = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === script) {
	const root = resolve(dirname(script), '..');
	try {
		const version = validateRelease(root, process.argv[2]);
		console.log(`Release metadata passed for ${version}.`);
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
