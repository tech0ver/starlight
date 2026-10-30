import { describe, expect, test } from 'bun:test';
import { compareVersions, releaseUrl, updateManifest } from '../scripts/consumer-update.mjs';

const metadata = { name: '@tech0ver/starlight', version: '0.8.0', peerDependencies: { astro: '7.3.5', '@astrojs/starlight': '0.42.5' } };
const manifest = () => ({ dependencies: { '@tech0ver/starlight': '^0.7.0', astro: '7.0.0', other: '2.0.0' }, devDependencies: { '@astrojs/starlight': '0.40.0' } });
describe('consumer updates', () => {
  test('updates only the package and installed peers in their existing sections', () => {
    const m = manifest();
    expect(updateManifest(m, '0.8.0', metadata)).toBe(true);
    expect(m.dependencies).toEqual({ '@tech0ver/starlight': '0.8.0', astro: '7.3.5', other: '2.0.0' });
    expect(m.devDependencies).toEqual({ '@astrojs/starlight': '0.42.5' });
  });
  test('rejects missing required peers', () => {
    expect(() => updateManifest(manifest(), '0.8.0', { ...metadata, peerDependencies: { missing: '1.0.0' } })).toThrow('Required peer');
  });
  test('repeat and stale deliveries do not update', () => {
    const m = manifest();
    updateManifest(m, '0.8.0', metadata);
    expect(updateManifest(m, '0.8.0', metadata)).toBe(false);
    expect(updateManifest(manifest(), '0.8.0', metadata, ['0.9.0'])).toBe(false);
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1);
  });
  test('rejects invalid versions, mismatched releases and registry metadata', () => {
    expect(() => releaseUrl('01.2.3')).toThrow();
    expect(() => releaseUrl('0.8.0', 'https://example.com')).toThrow();
    expect(() => updateManifest(manifest(), '0.8.0', { ...metadata, version: '0.7.0' })).toThrow();
    expect(() => updateManifest({ dependencies: { '@tech0ver/starlight': 'latest' } }, '0.8.0', metadata)).toThrow();
  });
});

import { ownedUpdates, safeOwnedCommit, recoverableBranch } from '../scripts/consumer-pr.mjs';
test('only owned PRs on the default branch participate in ordering', () => {
  const context = { owner: 'tech0ver', base: 'main', bot: 'updates[bot]' };
  const pr = { headRefName: 'starlight-update/v0.8.0', author: { login: 'updates[bot]' }, headRepositoryOwner: { login: 'tech0ver' }, baseRefName: 'main' };
  expect(ownedUpdates([pr, { ...pr, author: { login: 'human' } }, { ...pr, baseRefName: 'other' }], context).map(p => p.version)).toEqual(['0.8.0']);
});
test('human edits and unrelated files prevent superseding a bot PR', () => {
  const commit = { author: { login: 'updates[bot]' }, commit: { message: 'chore: update starlight to 0.8.0' } };
  expect(safeOwnedCommit([commit], [{ filename: 'bun.lock' }], 'updates[bot]', '0.8.0')).toBe(true);
  expect(safeOwnedCommit([commit, commit], [{ filename: 'bun.lock' }], 'updates[bot]', '0.8.0')).toBe(false);
  expect(safeOwnedCommit([commit], [{ filename: 'astro.config.mjs' }], 'updates[bot]', '0.8.0')).toBe(false);
});

test('only the exact bot branch can recover a failed PR creation', () => {
  const branch = { tree: 'tree', expectedTree: 'tree', parents: ['base'], base: 'base', author: 'updates[bot]', bot: 'updates[bot]', message: 'chore: update starlight to 0.8.0', version: '0.8.0' };
  expect(recoverableBranch(branch)).toBe(true);
  expect(recoverableBranch({ ...branch, tree: 'human-edit' })).toBe(false);
  expect(recoverableBranch({ ...branch, author: 'human' })).toBe(false);
  expect(recoverableBranch({ ...branch, parents: ['old-base'] })).toBe(false);
});
