/// <reference lib="webworker" />
/**
 * Pollramp service worker: makes the office app work with no connection.
 *
 * - App shell, JS/CSS chunks, fonts, checklists and the offline basemap are precached per build.
 * - Navigations inside the app are answered from the cached shell first (offline-first);
 *   the app then reads everything from IndexedDB.
 * - Voter pages (/p) are network-first with a cached fallback.
 * - Photos are cached forever by id; map tiles are cached as they are viewed.
 * - Other API calls always go to the network; the app's sync engine handles failures.
 */
import { self } from '$app/service-worker';
import { assets, immutable, prerendered } from '$app/manifest';
import { version } from '$app/env';

const APP_CACHE = `pollramp-app-${version}`;
const PAGE_CACHE = 'pollramp-pages-v1';
const PHOTO_CACHE = 'pollramp-photos-v1';
const TILE_CACHE = 'pollramp-tiles-v1';
const MAX_TILES = 3000;
const SHELL = '/';

const toUrl = (path: string) => (path.startsWith('/') ? path : `/${path}`);
const PRECACHE = [
	...immutable.map((f) => toUrl(f.path)),
	...assets.map((f) => toUrl(f.path)),
	...prerendered.map((f) => toUrl(f.path))
];
const PRECACHED = new Set(PRECACHE);

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(APP_CACHE);
			await cache.addAll(PRECACHE);
			// The office app is client-rendered, so one HTML shell serves every app route.
			const shell = await fetch(SHELL, { credentials: 'same-origin', cache: 'no-store' });
			if (shell.ok) await cache.put(SHELL, shell);
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key.startsWith('pollramp-app-') && key !== APP_CACHE) await caches.delete(key);
			}
			await self.clients.claim();
		})()
	);
});

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const hit = await cache.match(request);
	if (hit) return hit;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(request, response.clone());
		return response;
	} catch (error) {
		const hit = await cache.match(request);
		if (hit) return hit;
		throw error;
	}
}

async function appShell(request: Request): Promise<Response> {
	const cache = await caches.open(APP_CACHE);
	const shell = await cache.match(SHELL);
	if (shell) return shell;
	try {
		return await fetch(request);
	} catch {
		return new Response(
			'<h1>Pollramp is offline</h1><p>Open the app once while online to use it offline.</p>',
			{
				status: 503,
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			}
		);
	}
}

async function trimTiles(): Promise<void> {
	const cache = await caches.open(TILE_CACHE);
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - MAX_TILES))) await cache.delete(key);
}

let tileWrites = 0;
async function staleWhileRevalidate(request: Request): Promise<Response> {
	const cache = await caches.open(TILE_CACHE);
	const hit = await cache.match(request);
	const network = fetch(request)
		.then(async (response) => {
			if (response.ok) {
				await cache.put(request, response.clone());
				if (++tileWrites % 200 === 0) void trimTiles();
			}
			return response;
		})
		.catch(() => hit ?? Response.error());
	return hit ?? network;
}

function isMapResource(url: URL, request: Request): boolean {
	return (
		/\/(tiles?|styles?|fonts?|glyphs|sprites?)\//i.test(url.pathname) ||
		/\.(pbf|mvt|png|webp|jpg)$/i.test(url.pathname) ||
		(request.destination === 'image' && url.hostname.includes('tile'))
	);
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	if (url.origin !== self.location.origin) {
		if (url.protocol === 'https:' && isMapResource(url, request))
			event.respondWith(staleWhileRevalidate(request));
		return;
	}

	if (url.pathname.startsWith('/api/photos/')) {
		event.respondWith(cacheFirst(request, PHOTO_CACHE));
		return;
	}
	if (url.pathname.startsWith('/api/')) return;

	if (PRECACHED.has(url.pathname)) {
		event.respondWith(cacheFirst(request, APP_CACHE));
		return;
	}

	if (request.mode === 'navigate') {
		if (url.pathname === '/p' || url.pathname.startsWith('/p/')) {
			event.respondWith(networkFirst(request, PAGE_CACHE));
		} else {
			event.respondWith(appShell(request));
		}
		return;
	}

	if (url.pathname.startsWith('/p/')) {
		event.respondWith(networkFirst(request, PAGE_CACHE));
	}
});
