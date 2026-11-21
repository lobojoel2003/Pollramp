<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FixCard from '#lib/components/FixCard.svelte';
	import KitList from '#lib/components/KitList.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import {
		availableOverlays,
		defaultChecklistKey,
		latestBase,
		tryGetChecklist
	} from '#lib/checklist/registry.ts';
	import { docKey } from '#lib/checklist/resolve.ts';
	import { firstUnanswered } from '#lib/checklist/evaluate.ts';
	import { app } from '#lib/client/store.svelte.ts';
	import type { VoterInfo } from '#lib/model.ts';

	const site = $derived(app.site(page.params.id ?? ''));
	const surveys = $derived(site ? app.surveysFor(site.id) : []);
	const draft = $derived(surveys.find((s) => s.state === 'draft'));
	const latest = $derived(site ? app.latestSubmitted(site.id) : undefined);
	const status = $derived(site ? app.statusOf(site.id) : 'unsurveyed');
	const checklist = $derived(latest ? tryGetChecklist(latest.checklist) : undefined);
	const canEdit = $derived(app.user?.role === 'admin' || app.user?.role === 'surveyor');
	const isAdmin = $derived(app.user?.role === 'admin');

	const base = latestBase();
	const checklistOptions = [
		{ key: docKey(base), label: `${base.title} (federal only)` },
		...availableOverlays().map((o) => ({
			key: `${docKey(base)}+${docKey(o)}`,
			label: `Federal + ${o.title.replace(' overlay', '')}`
		}))
	];
	let chosenChecklist = $state<string | null>(null);
	const checklistKey = $derived(
		chosenChecklist ?? defaultChecklistKey(site?.state || app.config?.defaultState)
	);

	const failures = $derived(
		latest?.result && checklist
			? latest.result.items
					.filter((r) => r.outcome === 'fail')
					.map((r) => ({
						result: r,
						item: checklist.sections.flatMap((s) => s.items).find((i) => i.id === r.id)!
					}))
					.filter((f) => f.item)
			: []
	);
	const labels = $derived(
		checklist
			? Object.fromEntries(checklist.sections.flatMap((s) => s.items.map((i) => [i.id, i.prompt])))
			: {}
	);

	async function start() {
		if (!site) return;
		const survey = await app.startSurvey(site.id, checklistKey);
		await goto(`/surveys/${survey.id}`);
	}

	function resume(id: string) {
		const s = app.survey(id);
		const c = s ? tryGetChecklist(s.checklist) : undefined;
		const next = s && c ? firstUnanswered(c, s.responses) : undefined;
		return next ? `/surveys/${id}/${next.item.id}` : `/surveys/${id}/review`;
	}

	// Voter page editing
	let editingVoter = $state(false);
	let voterInfo = $state<VoterInfo>({
		accessibleEntrance: '',
		parking: '',
		contact: '',
		notes: ''
	});
	let photoId = $state<string | null>(null);
	let voterMessage = $state<string | null>(null);
	const latestPhotos = $derived(latest ? app.photosFor(latest.id) : []);
	let photoUrls = $state<Record<string, string>>({});
	$effect(() => {
		for (const p of latestPhotos) {
			if (!photoUrls[p.id]) void app.photoUrl(p.id).then((url) => (photoUrls[p.id] = url));
		}
	});

	function editVoter() {
		if (!site) return;
		voterInfo = { ...site.voterInfo };
		photoId = site.publicPhotoId;
		editingVoter = true;
	}

	async function saveVoter(publish?: boolean) {
		if (!site) return;
		await app.saveSite({
			...site,
			voterInfo: { ...voterInfo },
			publicPhotoId: photoId,
			published: publish ?? site.published
		});
		editingVoter = false;
		voterMessage =
			publish === undefined
				? 'Saved.'
				: publish
					? 'Published. It will be live after the next sync.'
					: 'Unpublished.';
	}

	async function togglePublish() {
		if (!site) return;
		await app.saveSite({ ...site, published: !site.published });
		voterMessage = site.published
			? 'Published. It will be live after the next sync.'
			: 'Unpublished.';
	}

	let confirmDelete = $state(false);
	let deleteError = $state<string | null>(null);
	async function remove() {
		if (!site) return;
		try {
			await app.deleteSite(site.id);
			await goto('/');
		} catch (e) {
			deleteError = e instanceof Error ? e.message : 'Could not delete the site.';
		}
	}

	const fmt = (iso: string | null) =>
		iso
			? new Date(iso).toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			: '—';
</script>

<svelte:head><title>{site?.name ?? 'Site'} · Pollramp</title></svelte:head>

{#snippet surveyCard()}
	{#if canEdit}
		<section class="card stack survey-start" aria-labelledby="survey-h">
			<h2 id="survey-h">
				{draft ? 'Survey in progress' : latest ? 'Survey again' : 'Survey this site'}
			</h2>
			{#if draft}
				{@const c = tryGetChecklist(draft.checklist)}
				<p>
					Started {fmt(draft.startedAt)} by {draft.surveyor || 'unknown'} ·
					{draft.result
						? `${draft.result.counts.total - draft.result.counts.unanswered} of ${draft.result.counts.total} answered`
						: ''}
				</p>
				<p class="small muted">{c?.title}</p>
				<div class="cluster">
					<a class="btn btn-primary btn-lg" href={resume(draft.id)}>Continue survey</a>
					<a class="btn" href={`/surveys/${draft.id}`}>Overview</a>
				</div>
			{:else}
				<p class="muted">
					Walk the route in order — parking, the path to the door, the entrance, and the voting
					room.
				</p>
				<div class="field">
					<label for="checklist">Checklist</label>
					<select
						id="checklist"
						value={checklistKey}
						onchange={(e) => (chosenChecklist = e.currentTarget.value)}
					>
						{#each checklistOptions as o (o.key)}<option value={o.key}>
								{o.label}
							</option>{/each}
					</select>
				</div>
				<button class="btn btn-primary btn-lg" type="button" onclick={start}> Start survey </button>
			{/if}
		</section>
	{/if}
{/snippet}

{#if !site}
	<div class="container-narrow page">
		<div class="card">
			<h1>Site not found</h1>
			<p>This site is not on this device yet. <a href="/">Back to sites</a></p>
		</div>
	</div>
{:else}
	<div class="container page stack" style="--gap: 1.5rem">
		<nav aria-label="Breadcrumb" class="small"><a href="/">Sites</a></nav>

		<header class="spread head">
			<div class="stack" style="--gap: .4rem">
				<h1>{site.name}</h1>
				<p class="muted">
					{[site.address, site.city, [site.state, site.postalCode].filter(Boolean).join(' ')]
						.filter(Boolean)
						.join(', ') || 'No address yet'}
				</p>
				<div class="cluster" style="--gap: .5rem">
					<StatusBadge {status} />
					{#each site.precincts as p (p)}<span class="tag">Precinct {p}</span>{/each}
					{#if site.published}<a class="tag" href={`/p/${site.slug}`}>Voter page live ↗</a>{/if}
					{#if site.dirty}<span class="tag">Not synced yet</span>{/if}
				</div>
			</div>
			{#if canEdit}<a class="btn" href={`/sites/${site.id}/edit`}>Edit site</a>{/if}
		</header>

		<div class="layout">
			<div class="stack" style="--gap: 1.5rem">
				{#if !latest || draft}{@render surveyCard()}{/if}

				{#if latest?.result}
					<section class="card stack" aria-labelledby="result-h">
						<div class="spread">
							<h2 id="result-h">Latest survey</h2>
							<span class="small muted">{fmt(latest.submittedAt)} · {latest.surveyor}</span>
						</div>
						<ul class="sections">
							{#each latest.result.sections.filter((s) => s.status !== 'na') as sec (sec.id)}
								<li>
									<span>{sec.title}</span>
									<StatusBadge status={sec.status} short />
								</li>
							{/each}
						</ul>
						<a class="btn" href={`/surveys/${latest.id}/review`}>Full report</a>
					</section>

					{#if failures.length}
						<section class="stack" aria-labelledby="fix-h" style="--gap: .75rem">
							<h2 id="fix-h">Barriers and election-day fixes ({failures.length})</h2>
							{#each failures as f (f.item.id)}
								<FixCard item={f.item} result={f.result} answer={latest.responses[f.item.id]} />
							{/each}
						</section>
					{/if}

					<section class="card stack" aria-labelledby="kit-h">
						<div class="spread">
							<h2 id="kit-h">Election-day kit for this site</h2>
							<button class="btn no-print" type="button" onclick={() => print()}>Print</button>
						</div>
						<KitList kit={latest.result.kit} {labels} />
					</section>
				{/if}
				{#if latest && !draft}{@render surveyCard()}{/if}
			</div>

			<aside class="stack" style="--gap: 1.5rem">
				<section class="card stack" aria-labelledby="voter-h">
					<div class="spread">
						<h2 id="voter-h">Voter page</h2>
						<span class="status {site.published ? 's-accessible' : 's-unsurveyed'}">
							<span class="status-glyph" aria-hidden="true">{site.published ? '✓' : '○'}</span>
							{site.published ? 'Published' : 'Not published'}
						</span>
					</div>
					<p class="small muted">
						A plain-language page for voters with disabilities: parking, the accessible entrance,
						ramps and equipment, generated from the latest survey.
					</p>
					{#if site.published}
						<p class="small"><a href={`/p/${site.slug}`}>/p/{site.slug}</a></p>
					{/if}

					{#if editingVoter}
						<div class="stack">
							<div class="field">
								<label for="v-entrance">Where is the accessible entrance?</label>
								<textarea
									id="v-entrance"
									bind:value={voterInfo.accessibleEntrance}
									placeholder="Use the north door on Elm Street, next to the playground."
								></textarea>
							</div>
							<div class="field">
								<label for="v-parking">Parking directions</label>
								<textarea
									id="v-parking"
									bind:value={voterInfo.parking}
									placeholder="Accessible spaces are in the front row of the east lot."></textarea>
							</div>
							<div class="field">
								<label for="v-contact">Accessibility contact</label>
								<input
									id="v-contact"
									bind:value={voterInfo.contact}
									placeholder="Call (555) 010-0100"
								/>
							</div>
							<div class="field">
								<label for="v-notes">Anything else voters should know</label>
								<textarea id="v-notes" bind:value={voterInfo.notes}></textarea>
							</div>
							{#if latestPhotos.length}
								<fieldset class="stack photos-pick">
									<legend class="label">Photo on the voter page</legend>
									<label class="check">
										<input type="radio" name="photo" value={null} bind:group={photoId} /> No photo
									</label>
									<div class="thumbs">
										{#each latestPhotos as p (p.id)}
											<label class="thumb">
												<input type="radio" name="photo" value={p.id} bind:group={photoId} />
												{#if photoUrls[p.id]}<img
														src={photoUrls[p.id]}
														alt={`Photo for ${labels[p.itemId] ?? p.itemId}`}
													/>{/if}
											</label>
										{/each}
									</div>
								</fieldset>
							{/if}
							<div class="cluster">
								<button class="btn btn-primary" type="button" onclick={() => saveVoter()}>
									Save
								</button>
								<button class="btn btn-ghost" type="button" onclick={() => (editingVoter = false)}>
									Cancel
								</button>
							</div>
						</div>
					{:else}
						<dl class="voter-info small">
							<dt>Accessible entrance</dt>
							<dd>{site.voterInfo.accessibleEntrance || '—'}</dd>
							<dt>Parking</dt>
							<dd>{site.voterInfo.parking || '—'}</dd>
							<dt>Contact</dt>
							<dd>{site.voterInfo.contact || '—'}</dd>
						</dl>
						<div class="cluster">
							{#if canEdit}<button class="btn" type="button" onclick={editVoter}>
									Edit voter information
								</button>{/if}
							{#if isAdmin}
								<button
									class="btn {site.published ? 'btn-danger' : 'btn-primary'}"
									type="button"
									onclick={togglePublish}
									disabled={!latest && !site.published}
								>
									{site.published ? 'Unpublish' : 'Publish'}
								</button>
							{/if}
						</div>
						{#if isAdmin && !latest && !site.published}<p class="hint">
								Submit a survey before publishing.
							</p>{/if}
					{/if}
					{#if voterMessage}<p class="form-ok" role="status">{voterMessage}</p>{/if}
				</section>

				<section class="card stack" aria-labelledby="history-h">
					<h2 id="history-h">Survey history</h2>
					{#if surveys.length === 0}
						<p class="muted">No surveys yet.</p>
					{:else}
						<ul class="history">
							{#each surveys as s (s.id)}
								<li>
									<a href={s.state === 'draft' ? `/surveys/${s.id}` : `/surveys/${s.id}/review`}>
										{fmt(s.submittedAt ?? s.startedAt)}
									</a>
									<span class="small muted">
										{s.surveyor || '—'}{s.election ? ` · ${s.election}` : ''}
									</span>
									{#if s.state === 'draft'}<span class="tag">
											Draft
										</span>{:else if s.result}<StatusBadge status={s.result.status} short />{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				{#if site.notes}
					<section class="card">
						<h2>Internal notes</h2>
						<p class="pre">{site.notes}</p>
					</section>
				{/if}

				{#if isAdmin}
					<section class="card stack danger" aria-labelledby="danger-h">
						<h2 id="danger-h">Remove site</h2>
						{#if confirmDelete}
							<p>
								Delete <strong>{site.name}</strong> and all its surveys for everyone? This cannot be undone
								here.
							</p>
							<div class="cluster">
								<button class="btn btn-danger" type="button" onclick={remove}>Delete site</button>
								<button class="btn btn-ghost" type="button" onclick={() => (confirmDelete = false)}>
									Keep it
								</button>
							</div>
							{#if deleteError}<p class="form-error" role="alert">{deleteError}</p>{/if}
						{:else}
							<button class="btn btn-danger" type="button" onclick={() => (confirmDelete = true)}>
								Delete this site…
							</button>
						{/if}
					</section>
				{/if}
			</aside>
		</div>
	</div>
{/if}

<style>
	.head h1 {
		margin: 0;
	}
	.head p {
		margin: 0;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
	}
	.survey-start {
		border: 2px solid var(--brand);
	}
	.sections,
	.history {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.sections li,
	.history li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--line);
	}
	.voter-info {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3rem 0.75rem;
		margin: 0;
	}
	.voter-info dt {
		font-weight: 700;
	}
	.voter-info dd {
		margin: 0;
	}
	.photos-pick {
		border: 0;
		padding: 0;
		margin: 0;
	}
	.thumbs {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		gap: 0.5rem;
	}
	.thumb {
		position: relative;
		display: block;
		border-radius: 10px;
		overflow: hidden;
		border: 3px solid transparent;
		cursor: pointer;
	}
	.thumb:has(input:checked) {
		border-color: var(--brand);
	}
	.thumb input {
		position: absolute;
		top: 6px;
		left: 6px;
	}
	.thumb img {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
	}
	.pre {
		white-space: pre-wrap;
	}
	.danger {
		border-color: var(--fail-soft);
	}
	@media (max-width: 960px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
