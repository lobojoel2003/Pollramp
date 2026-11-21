<script lang="ts">
	import type { ChoiceOption } from '../../checklist/types.ts';

	interface Props {
		name: string;
		options: ChoiceOption[];
		value: string | boolean | null;
		onchange: (value: string | boolean) => void;
		labelledby: string;
	}
	let { name, options, value, onchange, labelledby }: Props = $props();
</script>

<div class="choices" role="radiogroup" aria-labelledby={labelledby}>
	{#each options as option (option.value)}
		<label class="choice" class:checked={value === option.value}>
			<input
				type="radio"
				{name}
				value={option.value}
				checked={value === option.value}
				onchange={() => onchange(option.value)}
			/>
			<span>{option.label}</span>
		</label>
	{/each}
</div>

<style>
	.choices {
		display: grid;
		gap: 0.6rem;
	}
	.choice {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		min-height: 60px;
		padding: 0.75rem 1rem;
		border: 2px solid var(--line-strong);
		border-radius: 14px;
		background: var(--surface);
		font-weight: 700;
		font-size: 1.1rem;
		cursor: pointer;
	}
	.choice:hover {
		border-color: var(--brand);
	}
	.choice.checked {
		border-color: var(--brand);
		background: var(--brand-soft);
	}
	.choice input {
		width: 1.5rem;
		height: 1.5rem;
		accent-color: var(--brand);
		flex: none;
	}
</style>
