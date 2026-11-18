import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const SCREENSHOT_DIR = path.resolve('.baseline-screenshots/after');

async function attachErrorCollectors(page: Page) {
	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	const serverErrors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') consoleErrors.push(msg.text());
	});
	page.on('pageerror', (err) => pageErrors.push(err.message));
	page.on('response', (res) => {
		if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`);
	});

	return { consoleErrors, pageErrors, serverErrors };
}

test('public API endpoints, login page, unauthenticated redirect, and 404 page work cleanly', async ({
	page,
	request
}) => {
	const { consoleErrors, pageErrors, serverErrors } = await attachErrorCollectors(page);
	const capture = process.env.CAPTURE_AFTER === '1';
	if (capture) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

	const healthRes = await request.get('/api/health');
	expect(healthRes.status()).toBe(200);
	expect(await healthRes.json()).toMatchObject({ success: true, data: { status: 'ok' } });

	for (const apiPath of [
		'/api/products/v1',
		'/api/gallery/v1/portfolio',
		'/api/gallery/v1',
		'/api/article/v1'
	]) {
		const res = await request.get(apiPath);
		expect(res.status()).toBe(200);
		expect(await res.json()).toMatchObject({ success: true, data: { items: expect.any(Array) } });
	}

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/admin', { waitUntil: 'load' });
	expect(page.url()).toContain('/login');
	await expect(page.getByRole('heading', { name: /sinar berkah/i })).toBeVisible();
	await expect(page.locator('#login-email')).toHaveAttribute('autocomplete', 'username');
	await expect(page.locator('#login-password')).toHaveAttribute('autocomplete', 'current-password');
	await page.evaluate(() => document.fonts.ready);

	if (capture) {
		await page.waitForTimeout(800);
		await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-desktop.png'), fullPage: true });
		await page.setViewportSize({ width: 390, height: 844 });
		await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-mobile.png'), fullPage: true });
	}

	expect(consoleErrors).toEqual([]);

	await page.setViewportSize({ width: 1440, height: 900 });
	const res404 = await page.goto('/halaman-tidak-ada-404', { waitUntil: 'load' });
	expect(res404?.status()).toBe(404);
	await expect(page.locator('h1')).toContainText(/tidak ditemukan/i);

	if (capture) {
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, 'not-found-desktop.png'),
			fullPage: true
		});
		await page.setViewportSize({ width: 390, height: 844 });
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, 'not-found-mobile.png'),
			fullPage: true
		});
	}

	expect(pageErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});

test('admin login flow and protected pages render when credentials are provided', async ({
	page
}) => {
	const email = process.env.E2E_ADMIN_EMAIL ?? 'admin@sinarberkah.com';
	const password = process.env.E2E_ADMIN_PASSWORD ?? 'admin1234';
	const { consoleErrors, pageErrors, serverErrors } = await attachErrorCollectors(page);
	const capture = process.env.CAPTURE_AFTER === '1';
	if (capture) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/login', { waitUntil: 'load' });
	await page.fill('#login-email', email);
	await page.fill('#login-password', password);

	const submitBtn = page.getByRole('button', { name: /^masuk$/i });
	await submitBtn.waitFor({ state: 'visible' });
	await expect(submitBtn).toBeEnabled({ timeout: 20_000 });
	await submitBtn.click();

	await page.waitForURL('**/admin', { timeout: 20_000 });

	const adminRoutes = [
		{ name: 'admin-dashboard', path: '/admin' },
		{ name: 'admin-storage', path: '/admin/storage' },
		{ name: 'admin-products', path: '/admin/products' },
		{ name: 'admin-products-new', path: '/admin/products/new' },
		{ name: 'admin-portfolio', path: '/admin/portfolio' },
		{ name: 'admin-portfolio-new', path: '/admin/portfolio/new' },
		{ name: 'admin-patterns', path: '/admin/patterns' },
		{ name: 'admin-patterns-new', path: '/admin/patterns/new' }
	];

	for (const route of adminRoutes) {
		await page.setViewportSize({ width: 1440, height: 900 });
		const res = await page.goto(route.path, { waitUntil: 'load' });
		expect(res?.status()).toBe(200);
		await page.evaluate(() => document.fonts.ready);
		if (capture) {
			await page.waitForTimeout(300);
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, `${route.name}-desktop.png`),
				fullPage: true
			});
			await page.setViewportSize({ width: 390, height: 844 });
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, `${route.name}-mobile.png`),
				fullPage: true
			});
		}
	}

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/admin', { waitUntil: 'load' });
	await page.getByRole('button', { name: /buka menu navigasi/i }).click();
	await expect(page.getByRole('button', { name: /tutup menu navigasi/i })).toBeVisible();
	await page.getByRole('button', { name: /tutup menu navigasi/i }).click();

	expect(consoleErrors).toEqual([]);
	expect(pageErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});
