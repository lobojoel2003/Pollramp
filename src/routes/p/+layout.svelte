<script lang="ts">
	import type { LayoutProps } from './$types';
	let { data, children }: LayoutProps = $props();
</script>

<a class="skip-link" href="#main">Skip to content</a>
<header class="public-header">
	<div class="container spread">
		<a class="brand" href="/p">
			<img src="/favicon.svg" alt="" width="32" height="32" />
			<span>
				<strong>{data.officeName}</strong>
				<span class="muted small">Polling place accessibility</span>
			</span>
		</a>
	</div>
</header>

<main id="main" class="container page">
	{@render children()}
</main>

<footer class="public-footer">
	<div class="container small muted">
		<p>
			Accessibility information is collected by trained surveyors using the federal ADA checklist
			for polling places. <a href="/api/public/sites.geojson">Download the open data (GeoJSON)</a>.
		</p>
		<p>
			Powered by <a href="https://github.com/lobojoel2003/Pollramp">Pollramp</a>, free software
			under the AGPL.
		</p>
	</div>
</footer>

<style>
	.public-header {
		background: var(--surface);
		border-bottom: 1px solid var(--line);
		padding-block: 0.75rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--ink);
		text-decoration: none;
	}
	.brand span {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.public-footer {
		border-top: 1px solid var(--line);
		padding-block: 1.5rem 3rem;
	}
</style>
