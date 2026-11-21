<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import SiteForm from '#lib/components/SiteForm.svelte';
	import type { Site } from '#lib/model.ts';
	import { app } from '#lib/client/store.svelte.ts';

	const site = $derived(app.site(page.params.id ?? ''));
</script>

<svelte:head><title>Edit {site?.name ?? 'site'} · Pollramp</title></svelte:head>

<div class="container-narrow page stack">
	{#if site}
		<nav aria-label="Breadcrumb" class="small">
			<a href="/">Sites</a> › <a href={`/sites/${site.id}`}>{site.name}</a>
		</nav>
		<h1>Edit {site.name}</h1>
		{#key site.id}
			<SiteForm
				{site}
				onsaved={(s: Site) => goto(`/sites/${s.id}`)}
				oncancel={() => goto(`/sites/${site.id}`)}
			/>
		{/key}
	{:else}
		<div class="card">
			<h1>Site not found</h1>
			<p>This site is not on this device. <a href="/">Back to sites</a></p>
		</div>
	{/if}
</div>
