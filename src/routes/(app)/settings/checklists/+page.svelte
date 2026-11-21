<script lang="ts">
	import Diagram from '#lib/diagrams/Diagram.svelte';
	import { availableOverlays, getChecklist, latestBase } from '#lib/checklist/registry.ts';
	import { docKey } from '#lib/checklist/resolve.ts';
	import { originLabel, requirementText, FIX_KIND } from '#lib/checklist/describe.ts';

	const base = latestBase();
	const options = [
		{ key: docKey(base), label: 'Federal base' },
		...availableOverlays().map((o) => ({
			key: `${docKey(base)}+${docKey(o)}`,
			label: `Federal + ${o.title.replace(' overlay', '')}`
		}))
	];
	let key = $state(options[0].key);
	const checklist = $derived(getChecklist(key));
	const count = $derived(checklist.sections.reduce((n, s) => n + s.items.length, 0));
</script>

<svelte:head><title>Checklists · Pollramp</title></svelte:head>

<div class="container page stack" style="--gap: 1.5rem">
	<nav aria-label="Breadcrumb" class="small"><a href="/settings">Settings</a></nav>
	<div class="spread">
		<div>
			<h1>Checklist browser</h1>
			<p class="muted">
				{checklist.title} · {count} items · <span class="mono">{checklist.key}</span>
			</p>
		</div>
		<div class="field">
			<label for="ck">Checklist</label>
			<select id="ck" bind:value={key}>
				{#each options as o (o.key)}<option value={o.key}>{o.label}</option>{/each}
			</select>
		</div>
	</div>

	<details class="card">
		<summary><strong>Sources</strong></summary>
		<ul>
			{#each checklist.sources as s (s.title)}
				<li>
					{#if s.url}<a href={s.url} rel="noopener">{s.title}</a>{:else}{s.title}{/if}{s.publisher
						? ` — ${s.publisher}`
						: ''}
				</li>
			{/each}
		</ul>
	</details>

	{#each checklist.sections as section, si (section.id)}
		<section class="stack" style="--gap: .75rem" aria-labelledby={`s-${section.id}`}>
			<h2 id={`s-${section.id}`}>{si + 1}. {section.title}</h2>
			<p class="muted">{section.summary}</p>
			<div class="items">
				{#each section.items as item (item.id)}
					<article class="card-flat item">
						<div class="thumb"><Diagram id={item.diagram} /></div>
						<div class="stack" style="--gap: .35rem">
							<div class="cluster" style="--gap: .35rem">
								<span class="tag mono">{item.id}</span>
								{#if originLabel(item.origin)}<span class="tag">
										{originLabel(item.origin)}
									</span>{/if}
								{#if section.gate === item.id}<span class="tag">Gate</span>{/if}
							</div>
							<strong>{item.prompt}</strong>
							{#if item.pass}<span class="small">Pass: {requirementText(item)}</span>{/if}
							{#if item.fix}<span class="small muted">
									{FIX_KIND[item.fix.kind].label}: {item.fix.summary}
								</span>{/if}
							{#if item.references?.length}<span class="small muted">
									{item.references.join(' · ')}
								</span>{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
		gap: 0.75rem;
	}
	.item {
		display: grid;
		grid-template-columns: 160px 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 520px) {
		.items {
			grid-template-columns: 1fr;
		}
		.item {
			grid-template-columns: 1fr;
		}
	}
</style>
