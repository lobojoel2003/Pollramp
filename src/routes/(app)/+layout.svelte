<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page, updated } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
	import SyncIndicator from '#lib/components/SyncIndicator.svelte';
	import { app } from '#lib/client/store.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const isLogin = $derived(page.url.pathname === '/login');
	const isSurveyScreen = $derived(
		/^\/surveys\/[^/]+\/[^/]+$/.test(page.url.pathname) && !page.url.pathname.endsWith('/review')
	);

	onMount(() => {
		const theme = localStorage.getItem('pollramp-theme');
		if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
		void app.start();
		return () => app.stop();
	});

	$effect(() => {
		if (app.ready && !app.user && !isLogin) {
			const next = page.url.pathname + page.url.search;
			void goto(`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`, {
				replaceState: true
			});
		}
	});

	const nav = $derived([
		{
			href: '/',
			label: 'Sites',
			match: (p: string) => p === '/' || p.startsWith('/sites') || p.startsWith('/surveys')
		},
		{ href: '/kit', label: 'Election-day kit', match: (p: string) => p.startsWith('/kit') },
		...(app.user?.role === 'admin'
			? [{ href: '/import', label: 'Import', match: (p: string) => p.startsWith('/import') }]
			: []),
		{ href: '/settings', label: 'Settings', match: (p: string) => p.startsWith('/settings') }
	]);

	let menuOpen = $state(false);
	$effect(() => {
		void page.url.pathname;
		menuOpen = false;
	});
</script>

{#if isLogin}
	{@render children()}
{:else if !app.ready || !app.user}
	<div class="splash" aria-live="polite">
		<Logo size={64} />
		<p class="muted">Loading Pollramp…</p>
	</div>
{:else}
	<a class="skip-link" href="#main">Skip to content</a>
	<header class="app-header" class:compact={isSurveyScreen}>
		<div class="container bar">
			<a class="brand" href="/">
				<Logo size={34} />
				<span class="brand-text">
					<strong>Pollramp</strong>
					{#if app.config?.officeName}<span class="office">{app.config.officeName}</span>{/if}
				</span>
			</a>
			<nav aria-label="Main" class:open={menuOpen}>
				<ul>
					{#each nav as item (item.href)}
						<li>
							<a href={item.href} aria-current={item.match(page.url.pathname) ? 'page' : undefined}>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<div class="right">
				<SyncIndicator />
				<button
					type="button"
					class="btn btn-ghost btn-icon menu-btn"
					aria-expanded={menuOpen}
					aria-label="Menu"
					onclick={() => (menuOpen = !menuOpen)}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M4 7h16M4 12h16M4 17h16"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	</header>

	{#if !app.online || app.serverReachable === false}
		<div class="offline-banner" role="status">
			<div class="container">
				Working offline. Everything you enter is saved on this device and will sync when you are
				back online.
			</div>
		</div>
	{/if}

	{#if updated.current}
		<div class="update-banner" role="status">
			<div class="container spread">
				<span>A new version of Pollramp is available.</span>
				<button class="btn" type="button" onclick={() => location.reload()}>Reload</button>
			</div>
		</div>
	{/if}

	<main id="main" tabindex="-1">
		{@render children()}
	</main>

	{#if !isSurveyScreen}
		<footer class="app-footer">
			<div class="container small muted spread">
				<span>Pollramp v{__POLLRAMP_VERSION__} · build {__POLLRAMP_BUILD__}</span>
				<span>
					<a href="/p">Voter pages</a> ·
					<a href="https://github.com/lobojoel2003/Pollramp">Source (AGPL-3.0)</a>
				</span>
			</div>
		</footer>
	{/if}
{/if}

<style>
	.splash {
		min-height: 100dvh;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 0.75rem;
	}
	.app-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		backdrop-filter: saturate(1.4) blur(8px);
		border-bottom: 1px solid var(--line);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-height: 64px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--ink);
		text-decoration: none;
	}
	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}
	.office {
		font-size: 0.8rem;
		color: var(--ink-2);
	}
	nav {
		flex: 1;
	}
	nav ul {
		display: flex;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 0.85rem;
		border-radius: 10px;
		color: var(--ink);
		font-weight: 700;
		text-decoration: none;
	}
	nav a:hover {
		background: var(--surface-2);
	}
	nav a[aria-current='page'] {
		background: var(--brand-soft);
		color: var(--brand);
	}
	.right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}
	.menu-btn {
		display: none;
	}
	.offline-banner {
		background: var(--fix-soft);
		color: var(--fix);
		font-weight: 700;
		padding: 0.6rem 0;
		font-size: 0.95rem;
	}
	main {
		outline: none;
	}
	.update-banner {
		background: var(--progress-soft);
		color: var(--progress);
		font-weight: 700;
		padding: 0.5rem 0;
	}
	.app-footer {
		border-top: 1px solid var(--line);
		padding: 1.25rem 0 2rem;
	}
	@media (max-width: 820px) {
		.menu-btn {
			display: inline-flex;
		}
		nav {
			display: none;
			position: absolute;
			top: 64px;
			left: 0;
			right: 0;
			background: var(--surface);
			border-bottom: 1px solid var(--line);
			box-shadow: var(--shadow);
			padding: 0.5rem 1rem 1rem;
		}
		nav.open {
			display: block;
		}
		nav ul {
			flex-direction: column;
		}
		.office {
			display: none;
		}
	}
	.compact .bar {
		min-height: 56px;
	}
</style>
