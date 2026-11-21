<script lang="ts">
	import { goto } from '$app/navigation';
	import SiteForm from '#lib/components/SiteForm.svelte';
	import type { Site } from '#lib/model.ts';
</script>

<svelte:head><title>Add a site · Pollramp</title></svelte:head>

<div class="container-narrow page stack">
	<nav aria-label="Breadcrumb" class="small"><a href="/">Sites</a></nav>
	<h1>Add a polling place</h1>
	<SiteForm onsaved={(site: Site) => goto(`/sites/${site.id}`)} oncancel={() => history.back()} />
</div>
