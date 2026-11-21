<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { tryGetChecklist } from '#lib/checklist/registry.ts';
	import { applicableItems, firstUnanswered, isAnswered } from '#lib/checklist/evaluate.ts';
	import { app } from '#lib/client/store.svelte.ts';

	const survey = $derived(app.survey(page.params.id ?? ''));
	const site = $derived(survey ? app.site(survey.siteId) : undefined);
	const checklist = $derived(survey ? tryGetChecklist(survey.checklist) : undefined);
	const asked = $derived(checklist && survey ? applicableItems(checklist, survey.responses) : []);
	const resumeAt = $derived(
		checklist && survey ? firstUnanswered(checklist, survey.responses) : undefined
	);
	const done = $derived(
		asked.filter(
			(e) => survey && (isAnswered(survey.responses[e.item.id]) || survey.responses[e.item.id]?.na)
		).length
	);

	const sections = $derived(
		checklist && survey
			? checklist.sections.map((s) => {
					const items = asked.filter((e) => e.section.id === s.id);
					const answered = items.filter(
						(e) => isAnswered(survey.responses[e.item.id]) || survey.responses[e.item.id]?.na
					).length;
					const res = survey.result?.sections.find((r) => r.id === s.id);
					return { section: s, items, answered, result: res };
				})
			: []
	);

	let surveyor = $state('');
	let election = $state('');
	$effect(() => {
		surveyor = survey?.surveyor ?? '';
		election = survey?.election ?? '';
	});

	async function saveMeta() {
		if (!survey || survey.state === 'submitted') return;
		if (surveyor !== survey.surveyor || election !== survey.election)
			await app.saveSurvey(survey.id, { surveyor, election });
	}

	let confirmDiscard = $state(false);
	async function discard() {
		if (!survey) return;
		const siteId = survey.siteId;
		await app.deleteSurvey(survey.id).catch(() => undefined);
		await goto(`/sites/${siteId}`);
	}
</script>

<svelte:head><title>Survey · {site?.name ?? 'Pollramp'}</title></svelte:head>

{#if !survey || !checklist}
	<div class="container-narrow page">
		<div class="card">
			<h1>Survey not found</h1>
			<p><a href="/">Back to sites</a></p>
		</div>
	</div>
{:else}
	<div class="container-narrow page stack" style="--gap: 1.5rem">
		<nav aria-label="Breadcrumb" class="small">
			<a href="/">Sites</a> › <a href={`/sites/${survey.siteId}`}>{site?.name}</a>
		</nav>
		<header class="stack" style="--gap: .4rem">
			<h1>Survey: {site?.name}</h1>
			<p class="muted">{checklist.title}</p>
			<div class="cluster">
				{#if survey.state === 'submitted'}<span class="tag">Submitted</span>{:else}<span
						class="tag"
					>
						Draft
					</span>{/if}
				{#if survey.result}<StatusBadge status={survey.result.status} />{/if}
			</div>
		</header>

		<div class="card stack">
			<div class="progress-line">
				<strong>{done} of {asked.length} answered</strong>
				<div
					class="bar"
					role="progressbar"
					aria-label="Answered"
					aria-valuemin={0}
					aria-valuemax={asked.length}
					aria-valuenow={done}
				>
					<span style:width={`${asked.length ? (done / asked.length) * 100 : 0}%`}></span>
				</div>
			</div>
			<div class="cluster">
				{#if survey.state === 'draft'}
					<a
						class="btn btn-primary btn-lg"
						href={resumeAt
							? `/surveys/${survey.id}/${resumeAt.item.id}`
							: `/surveys/${survey.id}/review`}
					>
						{done === 0 ? 'Start at parking' : resumeAt ? 'Continue' : 'Review and submit'}
					</a>
				{/if}
				<a class="btn btn-lg" href={`/surveys/${survey.id}/review`}>
					{survey.state === 'submitted' ? 'View report' : 'Review'}
				</a>
			</div>
		</div>

		<div class="card stack">
			<h2>Survey details</h2>
			<div class="grid-auto" style="--min: 220px">
				<div class="field">
					<label for="surveyor">Surveyor</label>
					<input
						id="surveyor"
						bind:value={surveyor}
						onblur={saveMeta}
						disabled={survey.state === 'submitted'}
					/>
				</div>
				<div class="field">
					<label for="election">Election</label>
					<input
						id="election"
						bind:value={election}
						onblur={saveMeta}
						placeholder="2026 General"
						disabled={survey.state === 'submitted'}
					/>
				</div>
			</div>
		</div>

		<section class="stack" style="--gap: .75rem" aria-labelledby="route-h">
			<h2 id="route-h">The route</h2>
			<ol class="route">
				{#each sections as s, i (s.section.id)}
					<li class="card-flat" class:skipped={s.items.length === 0}>
						<span class="n" aria-hidden="true">{i + 1}</span>
						<div class="stack" style="--gap: .2rem">
							{#if s.items.length}
								<a href={`/surveys/${survey.id}/${s.items[0].item.id}`}>
									<strong>{s.section.title}</strong>
								</a>
							{:else}
								<strong>{s.section.title}</strong>
							{/if}
							<span class="small muted">
								{s.items.length
									? `${s.answered} of ${s.items.length} answered`
									: 'Not applicable at this site'}
							</span>
						</div>
						{#if s.result && s.result.status !== 'na' && s.answered > 0}<StatusBadge
								status={s.result.status}
								short
							/>{/if}
					</li>
				{/each}
			</ol>
		</section>

		{#if survey.state === 'draft'}
			<div class="card stack">
				{#if confirmDiscard}
					<p>Discard this draft survey and its answers?</p>
					<div class="cluster">
						<button class="btn btn-danger" type="button" onclick={discard}>Discard draft</button>
						<button class="btn btn-ghost" type="button" onclick={() => (confirmDiscard = false)}>
							Keep it
						</button>
					</div>
				{:else}
					<button
						class="btn btn-ghost btn-danger"
						type="button"
						onclick={() => (confirmDiscard = true)}
					>
						Discard draft…
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.progress-line {
		display: grid;
		gap: 0.5rem;
	}
	.bar {
		height: 10px;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--brand);
	}
	.route {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
		counter-reset: step;
	}
	.route li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.9rem;
		align-items: center;
	}
	.route li.skipped {
		opacity: 0.65;
	}
	.n {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		background: var(--brand-soft);
		color: var(--brand);
		font-weight: 700;
	}
	.route a {
		color: var(--ink);
	}
</style>
