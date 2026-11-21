<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FixCard from '#lib/components/FixCard.svelte';
	import KitList from '#lib/components/KitList.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { STATUS } from '#lib/checklist/status.ts';
	import { answerText } from '#lib/checklist/describe.ts';
	import { tryGetChecklist } from '#lib/checklist/registry.ts';
	import { app } from '#lib/client/store.svelte.ts';

	const survey = $derived(app.survey(page.params.id ?? ''));
	const site = $derived(survey ? app.site(survey.siteId) : undefined);
	const checklist = $derived(survey ? tryGetChecklist(survey.checklist) : undefined);
	const result = $derived(survey?.result);
	const allItems = $derived(checklist ? checklist.sections.flatMap((s) => s.items) : []);
	const byId = $derived(new Map(allItems.map((i) => [i.id, i])));
	const failures = $derived(result ? result.items.filter((r) => r.outcome === 'fail') : []);
	const unanswered = $derived(result ? result.items.filter((r) => r.outcome === 'unanswered') : []);
	const labels = $derived(Object.fromEntries(allItems.map((i) => [i.id, i.prompt])));
	const photos = $derived(survey ? app.photosFor(survey.id) : []);
	let urls = $state<Record<string, string>>({});
	$effect(() => {
		for (const p of photos) if (!urls[p.id]) void app.photoUrl(p.id).then((u) => (urls[p.id] = u));
	});

	let showAll = $state(false);
	let busy = $state(false);

	async function submit() {
		if (!survey) return;
		busy = true;
		await app.saveSurvey(survey.id, { state: 'submitted' });
		busy = false;
		await goto(`/sites/${survey.siteId}`);
	}

	async function reopen() {
		if (!survey) return;
		await app.saveSurvey(survey.id, { state: 'draft' });
	}

	const fmt = (iso: string | null | undefined) =>
		iso
			? new Date(iso).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: '—';
</script>

<svelte:head><title>Survey report · {site?.name ?? 'Pollramp'}</title></svelte:head>

{#if !survey || !checklist || !result}
	<div class="container-narrow page">
		<div class="card">
			<h1>Survey not found</h1>
			<p><a href="/">Back to sites</a></p>
		</div>
	</div>
{:else}
	<div class="container-narrow page stack report" style="--gap: 1.5rem">
		<nav aria-label="Breadcrumb" class="small no-print">
			<a href="/">Sites</a> › <a href={`/sites/${survey.siteId}`}>{site?.name}</a> ›
			<a href={`/surveys/${survey.id}`}>Survey</a>
		</nav>

		<header class="stack" style="--gap: .4rem">
			<p class="small muted">Accessibility survey report</p>
			<h1>{site?.name}</h1>
			<p class="muted">{[site?.address, site?.city, site?.state].filter(Boolean).join(', ')}</p>
			<p class="small muted">
				{survey.state === 'submitted'
					? `Submitted ${fmt(survey.submittedAt)}`
					: `Started ${fmt(survey.startedAt)} (draft)`}
				· {survey.surveyor || 'Unknown surveyor'}{survey.election ? ` · ${survey.election}` : ''}
			</p>
			<p class="small muted">{checklist.title} <span class="mono">({checklist.key})</span></p>
		</header>

		<section class="banner s-{result.status}" aria-labelledby="status-h">
			<span class="status-glyph big" aria-hidden="true">{STATUS[result.status].glyph}</span>
			<div>
				<h2 id="status-h">{STATUS[result.status].label}</h2>
				<p>{STATUS[result.status].description}</p>
				<p class="small">
					{result.counts.pass} passed · {result.counts.fail} failed · {result.counts.na} not applicable{result
						.counts.unanswered
						? ` · ${result.counts.unanswered} unanswered`
						: ''}
				</p>
			</div>
		</section>

		{#if unanswered.length && survey.state === 'draft'}
			<section class="card stack no-print" aria-labelledby="todo-h">
				<h2 id="todo-h">Still to answer ({unanswered.length})</h2>
				<ul>
					{#each unanswered as r (r.id)}
						<li><a href={`/surveys/${survey.id}/${r.id}`}>{byId.get(r.id)?.prompt}</a></li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="stack" aria-labelledby="sections-h" style="--gap: .75rem">
			<h2 id="sections-h">By section</h2>
			<ul class="sections">
				{#each result.sections as s (s.id)}
					<li class="card-flat">
						<strong>{s.title}</strong>
						<span class="small muted">
							{s.status === 'na' ? 'Not applicable' : `${s.pass} passed · ${s.fail} failed`}
						</span>
						<StatusBadge status={s.status} short />
					</li>
				{/each}
			</ul>
		</section>

		{#if failures.length}
			<section class="stack" aria-labelledby="fail-h" style="--gap: .75rem">
				<h2 id="fail-h">Barriers and fixes</h2>
				{#each failures as r (r.id)}
					{@const item = byId.get(r.id)}
					{#if item}
						<FixCard
							{item}
							result={r}
							answer={survey.responses[r.id]}
							href={survey.state === 'draft' ? `/surveys/${survey.id}/${r.id}` : undefined}
						/>
					{/if}
				{/each}
			</section>
		{/if}

		<section class="card stack" aria-labelledby="kit-h">
			<h2 id="kit-h">Election-day kit</h2>
			<KitList kit={result.kit} {labels} />
		</section>

		{#if photos.length}
			<section class="stack" aria-labelledby="photos-h" style="--gap: .75rem">
				<h2 id="photos-h">Photos ({photos.length})</h2>
				<div class="photos">
					{#each photos as p (p.id)}
						<figure>
							{#if urls[p.id]}<img
									src={urls[p.id]}
									alt={`Photo for: ${labels[p.itemId] ?? p.itemId}`}
									loading="lazy"
								/>{/if}
							<figcaption class="small">{labels[p.itemId] ?? p.itemId}</figcaption>
						</figure>
					{/each}
				</div>
			</section>
		{/if}

		<section class="stack" aria-labelledby="all-h" style="--gap: .75rem">
			<div class="spread">
				<h2 id="all-h">All answers</h2>
				<button
					class="btn no-print"
					type="button"
					onclick={() => (showAll = !showAll)}
					aria-expanded={showAll}
				>
					{showAll ? 'Hide' : 'Show'}
				</button>
			</div>
			{#if showAll}
				<div class="table-wrap">
					<table class="table">
						<thead><tr><th>Question</th><th>Answer</th><th>Result</th></tr></thead>
						<tbody>
							{#each result.items.filter((r) => r.outcome !== 'skipped') as r (r.id)}
								<tr>
									<td>{byId.get(r.id)?.prompt}</td>
									<td>
										{byId.get(r.id) ? answerText(byId.get(r.id)!, survey.responses[r.id]) : ''}
									</td>
									<td><span class="tag">{r.outcome}</span></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<div class="cluster no-print actions">
			{#if survey.state === 'draft' && app.user?.role !== 'viewer'}
				<button
					class="btn btn-primary btn-lg"
					type="button"
					onclick={submit}
					disabled={busy || result.status === 'incomplete'}
				>
					Submit survey
				</button>
				{#if result.status === 'incomplete'}<span class="hint">
						Answer or mark “does not apply” for every question to submit.
					</span>{/if}
			{:else if survey.state === 'submitted' && app.user?.role !== 'viewer'}
				<button class="btn" type="button" onclick={reopen}>Reopen for edits</button>
			{/if}
			<button class="btn btn-lg" type="button" onclick={() => print()}>Print report</button>
		</div>
	</div>
{/if}

<style>
	.banner {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		background: var(--s-soft);
		border-left: 8px solid var(--s);
		border-radius: var(--radius);
		padding: 1.25rem;
	}
	.banner h2 {
		color: var(--s);
		margin: 0 0 0.25rem;
	}
	.banner p {
		margin: 0 0 0.25rem;
	}
	.status-glyph.big {
		width: 3rem;
		height: 3rem;
		font-size: 1.5rem;
		flex: none;
	}
	.sections {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.sections li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.75rem;
		align-items: center;
	}
	.photos {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 0.75rem;
	}
	.photos figure {
		margin: 0;
	}
	.photos img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}
	.actions {
		position: sticky;
		bottom: 0;
		background: var(--bg);
		padding-block: 1rem;
	}
</style>
