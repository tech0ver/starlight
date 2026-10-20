import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRelease } from '../scripts/check-release.mjs';

const temporaryDirectories = [];

function fixture(overrides = {}) {
	const root = mkdtempSync(join(tmpdir(), 'starlight-release-test-'));
	temporaryDirectories.push(root);
	mkdirSync(join(root, 'packages/starlight'), { recursive: true });
	writeFileSync(join(root, 'packages/starlight/package.json'), JSON.stringify({
		name: '@tech0ver/starlight',
		version: overrides.packageVersion || '0.1.0',
		publishConfig: { registry: 'https://npm.pkg.github.com' },
	}));
	writeFileSync(join(root, '.release-please-manifest.json'), JSON.stringify({
		'packages/starlight': overrides.manifestVersion || '0.1.0',
	}));
	writeFileSync(join(root, 'bun.lock'), [
		'{',
		'  "workspaces": {',
		'    "packages/starlight": {',
		'      "name": "@tech0ver/starlight",',
		`      "version": "${overrides.lockVersion || '0.1.0'}", // x-release-please-version`,
		'    },',
		'  },',
		'}',
	].join('\n'));
	writeFileSync(join(root, 'packages/starlight/CHANGELOG.md'), overrides.changelog || [
		'# Changelog',
		'',
		'## 0.1.0',
		'',
		'Initial package capabilities.',
		'',
	].join('\n'));
	return root;
}

afterEach(() => {
	for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('release metadata validation', () => {
	test('accepts the complete initial release', () => {
		expect(validateRelease(fixture(), 'v0.1.0')).toBe('0.1.0');
	});

	test('rejects a tag that does not match the package', () => {
		expect(() => validateRelease(fixture(), 'v0.1.1')).toThrow('release tag version must match');
	});

	test('rejects malformed and non-canonical tags', () => {
		expect(() => validateRelease(fixture(), '0.1.0')).toThrow('release tag must be');
		expect(() => validateRelease(fixture(), 'v01.1.0')).toThrow('release tag must be');
	});

	test('rejects an empty latest changelog entry', () => {
		const root = fixture({ changelog: '# Changelog\n\n## 0.1.0\n' });
		expect(() => validateRelease(root)).toThrow('must contain release notes');
	});

	test('rejects package and manifest version drift', () => {
		expect(() => validateRelease(fixture({ packageVersion: '0.1.1' }))).toThrow('release manifest version must match');
	});

	test('rejects package and lockfile version drift', () => {
		expect(() => validateRelease(fixture({ lockVersion: '0.1.1' }))).toThrow('bun.lock workspace version must match');
	});
});
