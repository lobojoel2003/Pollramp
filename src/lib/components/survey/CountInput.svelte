<script lang="ts">
	interface Props {
		id: string;
		value: number | null;
		onchange: (value: number | null) => void;
		onenter?: () => void;
		describedby?: string;
	}
	let { id, value, onchange, onenter, describedby }: Props = $props();

	function set(n: number | null) {
		onchange(n === null || !Number.isFinite(n) ? null : Math.max(0, Math.round(n)));
	}
</script>

<div class="count">
	<button
		type="button"
		class="btn btn-lg step"
		aria-label="One fewer"
		onclick={() => set((value ?? 0) - 1)}
		disabled={(value ?? 0) <= 0}
	>
		−
	</button>
	<input
		{id}
		type="number"
		inputmode="numeric"
		min="0"
		step="1"
		value={value ?? ''}
		aria-describedby={describedby}
		enterkeyhint="next"
		oninput={(e) => set(e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				onenter?.();
			}
		}}
	/>
	<button
		type="button"
		class="btn btn-lg step"
		aria-label="One more"
		onclick={() => set((value ?? 0) + 1)}
	>
		+
	</button>
</div>

<style>
	.count {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}
	.count input {
		width: 8rem;
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
		min-height: 72px;
		font-variant-numeric: tabular-nums;
	}
	.step {
		width: 72px;
		min-height: 72px;
		font-size: 2rem;
	}
</style>
