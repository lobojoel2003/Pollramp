<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Pollramp</title>
</svelte:head>

<main class="container-narrow page" id="main">
	<div class="card stack">
		<p class="tag">Error {page.status}</p>
		<h1>{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
		<p>{page.error?.message ?? 'Please try again.'}</p>
		<div class="cluster">
			<a class="btn btn-primary" href="/">Go to the dashboard</a>
			<a class="btn" href="/p">Find a polling place</a>
		</div>
	</div>
</main>
