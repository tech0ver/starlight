import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';

const root = resolve('demo/dist');
const server = createServer(async (request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname;
	const file = resolve(root, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`);
	if (!file.startsWith(root + sep)) return response.writeHead(403).end();
	try {
		const content = await readFile(file);
		const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream';
		response.writeHead(200, { 'content-type': type }).end(content);
	} catch {
		response.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
	browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
	for (const width of [390, 1280]) for (const theme of ['light', 'dark']) {
		const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: width === 390 });
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
		await page.addInitScript((value) => localStorage.setItem('starlight-theme', value), theme);
		await page.goto(`http://127.0.0.1:${server.address().port}/starlight/table-terms/`);
		assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
		const tables = await page.locator('table').evaluateAll((items) => items.map((table) => ({ width: table.clientWidth, scrollWidth: table.scrollWidth, height: table.clientHeight, scrollHeight: table.scrollHeight })));
		assert.ok(tables.length);
		for (const table of tables) {
			assert.equal(table.scrollWidth, table.width, 'table should not scroll horizontally');
			assert.equal(table.scrollHeight, table.height, 'table should not scroll vertically');
		}
		const term = page.locator('table .term').last();
		const label = term.locator('.term-label');
		if (width === 390) await label.tap(); else await label.hover();
		const tip = term.locator('.term-tip');
		assert.equal(await tip.evaluate((el) => el.matches(':popover-open')), true);
		const rect = await tip.boundingBox();
		assert.ok(rect && rect.x >= 0 && rect.x + rect.width <= width && rect.y >= 0 && rect.y + rect.height <= 800, 'card fits viewport');
		assert.equal(await tip.locator('a').getAttribute('href'), '/starlight/configuration');
		if (width === 1280) {
			await label.focus();
			await page.evaluate(() => { document.querySelector('table').style.marginTop = '900px'; document.body.style.paddingBottom = '900px'; });
			await label.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().bottom - (innerHeight - 30)));
			await page.waitForFunction(() => document.querySelector('table .term:last-child[data-above]') || document.querySelector('table .term[data-above]'));
			const aboveRect = await tip.boundingBox();
			const labelRect = await label.boundingBox();
			assert.ok(aboveRect.y >= 0 && aboveRect.y + aboveRect.height <= labelRect.y + 1, 'card is placed above the term');
		}
		await term.locator('.term-tip-close').click();
		assert.equal(await label.getAttribute('aria-expanded'), 'false');
		await label.focus();
		await page.keyboard.press('Enter');
		assert.equal(await label.getAttribute('aria-expanded'), 'true');
		await page.keyboard.press('Escape');
		assert.equal(await label.getAttribute('aria-expanded'), 'false');
		assert.deepEqual(errors, []);
		console.log(`${width} ${theme}:`, tables);
		await page.close();
	}
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(resolve));
}
