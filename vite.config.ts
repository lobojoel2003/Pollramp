import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
	version: string;
};

function gitCommit(): string {
	if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
	try {
		return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return 'unknown';
	}
}

/**
 * Build metadata. CI sets BUILD_NUMBER (the GitHub Actions run number) and GITHUB_SHA;
 * local builds fall back to "dev" and the current git commit.
 */
const version = process.env.POLLRAMP_VERSION ?? pkg.version;
const build = process.env.BUILD_NUMBER ?? 'dev';
const commit = gitCommit();
const builtAt = process.env.SOURCE_DATE_EPOCH
	? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
	: new Date().toISOString();

export default defineConfig({
	define: {
		__POLLRAMP_VERSION__: JSON.stringify(version),
		__POLLRAMP_BUILD__: JSON.stringify(build),
		__POLLRAMP_COMMIT__: JSON.stringify(commit),
		__POLLRAMP_BUILT_AT__: JSON.stringify(builtAt)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ out: 'build' }),
			// Absolute asset URLs: the service worker serves one cached HTML shell for every app route.
			paths: { relative: false },
			// A unique name per build so the service worker refreshes its caches on every deploy.
			version: { name: `${version}+${build}.${commit.slice(0, 7)}` },
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:', 'https:'],
					'font-src': ['self', 'data:', 'https:'],
					'connect-src': ['self', 'https:'],
					'worker-src': ['self', 'blob:'],
					'child-src': ['self', 'blob:'],
					'manifest-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			}
		})
	],
	server: { fs: { allow: ['checklists', 'migrations'] } },
	// MapLibre (~1 MB) is loaded lazily, only on pages with a map.
	build: { chunkSizeWarningLimit: 1200 },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
