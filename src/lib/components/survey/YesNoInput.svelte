<script lang="ts">
	interface Props {
		value: boolean | null;
		onchange: (value: boolean) => void;
		labelledby: string;
	}
	let { value, onchange, labelledby }: Props = $props();
</script>

<div class="yesno" role="group" aria-labelledby={labelledby}>
	<button type="button" class="yn yes" aria-pressed={value === true} onclick={() => onchange(true)}>
		<span aria-hidden="true">✓</span> Yes
	</button>
	<button
		type="button"
		class="yn no"
		aria-pressed={value === false}
		onclick={() => onchange(false)}
	>
		<span aria-hidden="true">✕</span> No
	</button>
</div>

<style>
	.yesno {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		max-width: 32rem;
	}
	.yn {
		min-height: 80px;
		border-radius: 16px;
		border: 2px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 1.4rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
	}
	.yn:hover {
		border-color: var(--brand);
	}
	.yn[aria-pressed='true'] {
		background: var(--brand);
		border-color: var(--brand);
		color: var(--brand-ink);
	}
</style>
