<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Diagram from '#lib/diagrams/Diagram.svelte';
	import ChoiceInput from '#lib/components/survey/ChoiceInput.svelte';
	import CountInput from '#lib/components/survey/CountInput.svelte';
	import MeasureInput from '#lib/components/survey/MeasureInput.svelte';
	import PhotoStrip from '#lib/components/survey/PhotoStrip.svelte';
	import YesNoInput from '#lib/components/survey/YesNoInput.svelte';
	import { tryGetChecklist } from '#lib/checklist/registry.ts';
	import {
		applicableItems,
		evaluateItem,
		isAnswered,
		isApplicable,
		nextItem,
		previousItem,
		thresholdOf
	} from '#lib/checklist/evaluate.ts';
	import { FIX_KIND, originLabel, requirementText } from '#lib/checklist/describe.ts';
	import { kitSentence } from '#lib/checklist/kit.ts';
	import type { Answer } from '#lib/checklist/types.ts';
	import { app } from '#lib/client/store.svelte.ts';

	const surveyId = $derived(page.params.id ?? '');
	const itemId = $derived(page.params.item ?? '');
	const survey = $derived(app.survey(surveyId));
	const site = $derived(survey ? app.site(survey.siteId) : undefined);
	const checklist = $derived(survey ? tryGetChecklist(survey.checklist) : undefined);
	const responses = $derived(survey?.responses ?? {});
	const entry = $derived(
		checklist?.sections
			.flatMap((section) => section.items.map((item) => ({ item, section })))
			.find((e) => e.item.id === itemId)
	);
	const item = $derived(entry?.item);
	const section = $derived(entry?.section);
	const answer = $derived<Answer | undefined>(responses[itemId]);
	const result = $derived(
		checklist && entry ? evaluateItem(checklist, entry.section, entry.item, responses) : undefined
	);
	// Computed thresholds (e.g. ADA Table 208.2) are known before this item is answered.
	const threshold = $derived(item?.pass ? thresholdOf(item.pass, responses) : undefined);
	const asked = $derived(checklist ? applicableItems(checklist, responses) : []);
	const position = $derived(asked.findIndex((e) => e.item.id === itemId));
	const answeredCount = $derived(
		asked.filter((e) => isAnswered(responses[e.item.id]) || responses[e.item.id]?.na).length
	);
	const sectionItems = $derived(asked.filter((e) => e.section.id === section?.id));
	const sectionPos = $derived(sectionItems.findIndex((e) => e.item.id === itemId));
	const next = $derived(checklist ? nextItem(checklist, responses, itemId) : undefined);
	const prev = $derived(checklist ? previousItem(checklist, responses, itemId) : undefined);
	const origin = $derived(originLabel(item?.origin));
	const readOnly = $derived(survey?.state === 'submitted' || app.user?.role === 'viewer');
	const stillApplies = $derived(item && section ? isApplicable(item, section, responses) : false);

	const sections = $derived(
		checklist?.sections
			.map((s) => ({ section: s, first: asked.find((e) => e.section.id === s.id) }))
			.filter((s) => s.first) ?? []
	);

	// Keep the current section chip visible on narrow screens.
	let steps = $state<HTMLOListElement>();
	$effect(() => {
		void section?.id;
		steps
			?.querySelector('[aria-current="step"]')
			?.scrollIntoView({ inline: 'center', block: 'nearest' });
	});

	let noteOpen = $state(false);
	$effect(() => {
		void itemId;
		noteOpen = !!responses[itemId]?.note;
	});

	async function setAnswer(patch: Partial<Answer>) {
		if (!survey || readOnly) return;
		const current: Answer = survey.responses[itemId] ?? { value: null };
		const updated: Answer = { ...current, ...patch, answeredAt: new Date().toISOString() };
		await app.saveSurvey(survey.id, {
			responses: { ...$state.snapshot(survey.responses), [itemId]: updated }
		});
	}

	async function choose(value: string | boolean) {
		await setAnswer({ value, na: false });
		// Yes/no and choice answers advance on their own; measurements wait for "Next".
		setTimeout(() => void goNext(), 280);
	}

	async function goNext() {
		const target = checklist
			? nextItem(checklist, app.survey(surveyId)?.responses ?? {}, itemId)
			: undefined;
		await goto(target ? `/surveys/${surveyId}/${target.item.id}` : `/surveys/${surveyId}/review`);
	}

	function goPrev() {
		if (prev) void goto(`/surveys/${surveyId}/${prev.item.id}`);
		else void goto(`/surveys/${surveyId}`);
	}

	const promptId = 'q-prompt';
	const helpId = 'q-help';
</script>

<svelte:head>
	<title>{item?.prompt ?? 'Survey'} · {site?.name ?? 'Pollramp'}</title>
</svelte:head>

<svelte:window
	onkeydown={(e: KeyboardEvent) => {
		const target = e.target as HTMLElement;
		if (target.closest('input, textarea, select')) return;
		if (e.key === 'ArrowRight' && !e.altKey) void goNext();
		if (e.key === 'ArrowLeft' && !e.altKey) goPrev();
	}}
/>

{#if !survey || !checklist || !item || !section}
	<div class="container-narrow page">
		<div class="card">
			<h1>Question not found</h1>
			<p><a href={survey ? `/surveys/${surveyId}` : '/'}>Back</a></p>
		</div>
	</div>
{:else}
	<div class="survey">
		<div class="topbar">
			<div class="container topbar-inner">
				<a class="btn btn-ghost exit" href={`/surveys/${surveyId}`} aria-label="Survey overview">
					<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2.4"
							stroke-linecap="round"
						/>
					</svg>
				</a>
				<div class="where">
					<strong>{site?.name}</strong>
					<span class="small muted">
						{section.title} · {sectionPos + 1} of {sectionItems.length}
					</span>
				</div>
				<span class="small muted count">{answeredCount}/{asked.length}</span>
			</div>
			<div
				class="progress"
				role="progressbar"
				aria-label="Survey progress"
				aria-valuemin={0}
				aria-valuemax={asked.length}
				aria-valuenow={answeredCount}
			>
				<span style:width={`${asked.length ? (answeredCount / asked.length) * 100 : 0}%`}></span>
			</div>
			<nav class="container steps" aria-label="Sections">
				<ol bind:this={steps}>
					{#each sections as s (s.section.id)}
						<li>
							<a
								href={`/surveys/${surveyId}/${s.first!.item.id}`}
								aria-current={s.section.id === section.id ? 'step' : undefined}
							>
								{s.section.title}
							</a>
						</li>
					{/each}
				</ol>
			</nav>
		</div>

		<div class="container body">
			<div class="diagram-col">
				<Diagram id={item.diagram} />
			</div>

			<div class="question stack" style="--gap: 1.1rem">
				{#if sectionPos === 0}<p class="section-summary">{section.summary}</p>{/if}
				<div class="cluster" style="--gap: .4rem">
					{#if origin}<span class="tag origin">{origin}</span>{/if}
					{#if readOnly}<span class="tag">Read only — submitted</span>{/if}
				</div>
				<h1 id={promptId}>{item.prompt}</h1>
				{#if item.help}<p id={helpId} class="help">{item.help}</p>{/if}
				{#if item.pass && item.type !== 'yesno' && item.type !== 'choice'}
					<p class="requirement">Standard: <strong>{requirementText(item, threshold)}</strong></p>
				{/if}

				{#if !stillApplies}
					<p class="form-ok">
						An earlier answer means this question no longer applies. It will be skipped.
					</p>
				{/if}

				<fieldset class="answer" disabled={readOnly || answer?.na}>
					<legend class="visually-hidden">{item.prompt}</legend>
					{#key itemId}
						{#if item.type === 'measure'}
							<MeasureInput
								id="answer"
								unit={item.unit ?? 'in'}
								slope={item.slope}
								value={typeof answer?.value === 'number' ? answer.value : null}
								raw={answer?.raw}
								describedby={item.help ? helpId : undefined}
								onchange={(value: number | null, raw: string) =>
									setAnswer({ value, raw, na: false })}
								onenter={goNext}
							/>
						{:else if item.type === 'count'}
							<CountInput
								id="answer"
								value={typeof answer?.value === 'number' ? answer.value : null}
								describedby={item.help ? helpId : undefined}
								onchange={(value: number | null) => setAnswer({ value, na: false })}
								onenter={goNext}
							/>
						{:else if item.type === 'yesno'}
							<YesNoInput
								value={typeof answer?.value === 'boolean' ? answer.value : null}
								labelledby={promptId}
								onchange={choose}
							/>
						{:else if item.type === 'choice'}
							<ChoiceInput
								name={item.id}
								options={item.options ?? []}
								value={typeof answer?.value === 'number' ? null : (answer?.value ?? null)}
								labelledby={promptId}
								onchange={choose}
							/>
						{:else}
							<textarea
								aria-labelledby={promptId}
								value={typeof answer?.value === 'string' ? answer.value : ''}
								oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
									setAnswer({ value: e.currentTarget.value })}></textarea>
						{/if}
					{/key}
				</fieldset>

				<div aria-live="polite" class="verdict-wrap">
					{#if answer?.na}
						<div class="verdict s-na">
							<span class="status-glyph" aria-hidden="true">–</span> Marked as not applicable
						</div>
					{:else if result?.outcome === 'pass'}
						<div class="verdict s-pass">
							<span class="status-glyph" aria-hidden="true">✓</span> Meets the standard
						</div>
					{:else if result?.outcome === 'fail' && result.fix}
						<div class="verdict s-{result.fix.kind} stack" style="--gap: .4rem">
							<div class="verdict-head">
								<span class="status-glyph" aria-hidden="true">
									{result.fix.kind === 'structural' ? '✕' : '!'}
								</span>
								Does not meet the standard · {FIX_KIND[result.fix.kind].label}
							</div>
							<p>{result.fix.summary}</p>
							{#if result.fix.kit.length}
								<p class="kit-line">
									<strong>{kitSentence(result.fix.kit)}</strong> Added to the election-day kit.
								</p>
							{/if}
						</div>
					{/if}
				</div>

				<details class="extras" open={noteOpen || (answer?.photos?.length ?? 0) > 0}>
					<summary>
						Photos and notes{answer?.photos?.length
							? ` (${answer.photos.length} photo${answer.photos.length === 1 ? '' : 's'})`
							: ''}
					</summary>
					<div class="stack" style="--gap: .75rem">
						<PhotoStrip
							surveyId={survey.id}
							{itemId}
							photos={answer?.photos ?? []}
							disabled={readOnly}
							onchange={(photos: string[]) => setAnswer({ photos })}
						/>
						<div class="field">
							<label for="note">Note</label>
							<textarea
								id="note"
								value={answer?.note ?? ''}
								disabled={readOnly}
								oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
									setAnswer({ note: e.currentTarget.value })}
								placeholder="Where exactly? Anything the office should know?"></textarea>
						</div>
					</div>
				</details>

				{#if !readOnly}
					<button
						type="button"
						class="btn btn-ghost na"
						aria-pressed={!!answer?.na}
						onclick={() =>
							setAnswer({ na: !answer?.na, value: answer?.na ? (answer?.value ?? null) : null })}
					>
						{answer?.na ? 'Undo “does not apply”' : 'Does not apply here'}
					</button>
				{/if}

				{#if item.references?.length}
					<p class="refs small muted">{item.references.join(' · ')}</p>
				{/if}
			</div>
		</div>

		<div class="bottombar">
			<div class="container bottombar-inner">
				<button type="button" class="btn btn-lg" onclick={goPrev}>← Back</button>
				<span class="small muted pos">{position + 1} of {asked.length}</span>
				<button type="button" class="btn btn-primary btn-lg" onclick={goNext}>
					{next ? 'Next →' : 'Review →'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.survey {
		min-height: calc(100dvh - 56px);
		display: flex;
		flex-direction: column;
	}
	.topbar {
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}
	.topbar-inner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 56px;
	}
	.exit {
		width: 48px;
		padding: 0;
	}
	.where {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
		flex: 1;
		min-width: 0;
	}
	.where strong {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.count {
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}
	.progress {
		height: 6px;
		background: var(--surface-2);
	}
	.progress span {
		display: block;
		height: 100%;
		background: var(--brand);
		transition: width 0.3s;
	}
	.steps ol {
		display: flex;
		gap: 0.35rem;
		list-style: none;
		margin: 0;
		padding: 0.5rem 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.steps a {
		display: inline-flex;
		align-items: center;
		min-height: 36px;
		padding: 0 0.75rem;
		border-radius: 999px;
		border: 1.5px solid var(--line);
		white-space: nowrap;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-2);
		text-decoration: none;
	}
	.steps a[aria-current='step'] {
		background: var(--brand);
		border-color: var(--brand);
		color: var(--brand-ink);
	}
	.body {
		flex: 1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 2rem;
		padding-block: 1.5rem 7rem;
		align-items: start;
	}
	.diagram-col {
		position: sticky;
		top: 130px;
	}
	.section-summary {
		background: var(--brand-soft);
		color: var(--ink);
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		margin: 0;
	}
	.question h1 {
		font-size: clamp(1.4rem, 1.1rem + 1.2vw, 1.9rem);
		margin: 0;
	}
	.help {
		margin: 0;
		color: var(--ink-2);
		font-size: 1.05rem;
	}
	.requirement {
		margin: 0;
	}
	.origin {
		background: var(--progress-soft);
		color: var(--progress);
		border-color: transparent;
	}
	.answer {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	.answer:disabled {
		opacity: 0.6;
	}
	.verdict-wrap:empty {
		display: none;
	}
	.verdict {
		background: var(--s-soft);
		color: var(--ink);
		border-left: 6px solid var(--s);
		border-radius: var(--radius-sm);
		padding: 0.85rem 1rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.verdict.stack {
		display: flex;
		align-items: stretch;
	}
	.verdict p {
		margin: 0;
		font-weight: 400;
	}
	.verdict-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--s);
	}
	.kit-line strong {
		color: var(--fix);
	}
	.extras {
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		padding: 0.6rem 1rem;
		background: var(--surface);
	}
	.extras summary {
		cursor: pointer;
		font-weight: 700;
		min-height: 40px;
		display: flex;
		align-items: center;
	}
	.extras[open] summary {
		margin-bottom: 0.75rem;
	}
	.na {
		align-self: flex-start;
		text-decoration: underline;
	}
	.refs {
		margin: 0;
	}
	.bottombar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 15;
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		backdrop-filter: blur(8px);
		border-top: 1px solid var(--line);
		padding-bottom: env(safe-area-inset-bottom);
	}
	.bottombar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 76px;
	}
	.bottombar .btn-primary {
		min-width: 9rem;
	}
	.pos {
		font-variant-numeric: tabular-nums;
	}
	@media (max-width: 860px) {
		.body {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.diagram-col {
			position: static;
		}
	}
</style>
