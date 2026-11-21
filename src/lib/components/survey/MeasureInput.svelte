<script lang="ts">
	import { untrack } from 'svelte';
	import { slopePercent, slopeRatio } from '../../checklist/ada.ts';
	import { formatMeasurement, parseMeasurement, unitLabel } from '../../checklist/measure.ts';
	import type { Unit } from '../../checklist/types.ts';

	interface Props {
		id: string;
		unit: Unit;
		slope?: boolean;
		value: number | null;
		raw?: string;
		onchange: (value: number | null, raw: string) => void;
		onenter?: () => void;
		describedby?: string;
	}
	let {
		id,
		unit,
		slope = false,
		value,
		raw = '',
		onchange,
		onenter,
		describedby
	}: Props = $props();

	// Initialized from the saved answer; the parent re-mounts this component per item.
	let text = $state(untrack(() => raw || (value !== null ? String(value) : '')));
	let mode = $state<'percent' | 'riserun'>('percent');
	let rise = $state('');
	let run = $state('');

	const parsed = $derived(parseMeasurement(text, unit));
	const invalid = $derived(text.trim() !== '' && Number.isNaN(parsed));

	function commit() {
		const t = text.trim();
		if (t === '') onchange(null, '');
		else if (!Number.isNaN(parsed)) onchange(parsed, t);
	}

	function addFraction(f: string) {
		const whole = Math.floor(Number.isNaN(parsed) ? 0 : parsed);
		text = whole > 0 ? `${whole} ${f}` : f;
		commit();
	}

	const riseN = $derived(parseMeasurement(rise, 'in'));
	const runN = $derived(parseMeasurement(run, 'in'));
	const computed = $derived(slopePercent(riseN, runN));

	function useComputed() {
		if (!Number.isFinite(computed)) return;
		const pct = Math.round(computed * 100) / 100;
		text = String(pct);
		onchange(pct, `${rise} / ${run}`);
		mode = 'percent';
	}
</script>

<div class="measure stack" style="--gap: .75rem">
	{#if slope}
		<div class="segmented" role="group" aria-label="How to enter the slope">
			<button type="button" aria-pressed={mode === 'percent'} onclick={() => (mode = 'percent')}>
				Level reading (%)
			</button>
			<button type="button" aria-pressed={mode === 'riserun'} onclick={() => (mode = 'riserun')}>
				Rise and run
			</button>
		</div>
	{/if}

	{#if mode === 'percent'}
		<div class="input-row">
			<input
				{id}
				type="text"
				inputmode="decimal"
				autocomplete="off"
				enterkeyhint="next"
				placeholder={unit === 'in' ? 'e.g. 32 1/2' : unit === 'percent' ? 'e.g. 4.5' : 'e.g. 5'}
				bind:value={text}
				oninput={commit}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						commit();
						onenter?.();
					}
				}}
				aria-invalid={invalid}
				aria-describedby={describedby}
			/>
			<span class="unit" aria-hidden="true">{unitLabel(unit)}</span>
		</div>
		<p class="readout" aria-live="polite">
			{#if invalid}
				<span class="bad">Enter a number like 32, 32.5 or 32 1/2.</span>
			{:else if text.trim() !== ''}
				= <strong>{formatMeasurement(parsed, unit)}</strong>{#if unit === 'percent'}
					· {slopeRatio(parsed)}{/if}
			{/if}
		</p>
		{#if unit === 'in'}
			<div class="cluster fractions" style="--gap: .4rem" role="group" aria-label="Add a fraction">
				{#each ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] as f (f)}
					<button type="button" class="btn chip" onclick={() => addFraction(f)}>+{f}</button>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="grid-auto" style="--min: 140px">
			<div class="field">
				<label for={`${id}-rise`}>Rise (inches)</label>
				<input id={`${id}-rise`} type="text" inputmode="decimal" bind:value={rise} />
			</div>
			<div class="field">
				<label for={`${id}-run`}>Run (inches)</label>
				<input id={`${id}-run`} type="text" inputmode="decimal" bind:value={run} />
			</div>
		</div>
		<p class="readout" aria-live="polite">
			{#if Number.isFinite(computed)}
				Slope = <strong>{Math.round(computed * 100) / 100}%</strong> · {slopeRatio(computed)}
			{:else}
				Measure the height gained (rise) over a horizontal distance (run).
			{/if}
		</p>
		<button
			type="button"
			class="btn btn-primary"
			disabled={!Number.isFinite(computed)}
			onclick={useComputed}
		>
			Use this slope
		</button>
	{/if}
</div>

<style>
	.input-row {
		position: relative;
		max-width: 22rem;
	}
	.input-row input {
		font-size: 2rem;
		font-weight: 700;
		min-height: 72px;
		padding-right: 4.5rem;
		font-variant-numeric: tabular-nums;
	}
	.unit {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--ink-2);
	}
	.readout {
		min-height: 1.6em;
		margin: 0;
		color: var(--ink-2);
	}
	.bad {
		color: var(--fail);
		font-weight: 700;
	}
	.chip {
		min-height: 44px;
		padding: 0.3rem 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.segmented {
		display: inline-flex;
		border: 1.5px solid var(--line-strong);
		border-radius: 12px;
		overflow: hidden;
		align-self: flex-start;
	}
	.segmented button {
		min-height: 44px;
		padding: 0 1rem;
		border: 0;
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.segmented button[aria-pressed='true'] {
		background: var(--brand);
		color: var(--brand-ink);
	}
</style>
