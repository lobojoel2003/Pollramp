<script lang="ts">
	import { FIX_KIND, answerText, originLabel, requirementText } from '../checklist/describe.ts';
	import { kitSentence } from '../checklist/kit.ts';
	import type { Answer, Item, ItemResult } from '../checklist/types.ts';

	interface Props {
		item: Item;
		result: ItemResult;
		answer?: Answer;
		href?: string;
	}
	let { item, result, answer, href }: Props = $props();
	const fix = $derived(result.fix);
	const origin = $derived(originLabel(item.origin));
</script>

{#if fix}
	<article class="fix card-flat s-{fix.kind}">
		<header class="spread">
			<span class="status s-{fix.kind}">{FIX_KIND[fix.kind].label}</span>
			{#if origin}<span class="tag">{origin}</span>{/if}
		</header>
		<h3>
			{#if href}<a {href}>{item.prompt}</a>{:else}{item.prompt}{/if}
		</h3>
		<p class="measure">
			<span>Found: <strong>{answerText(item, answer)}</strong></span>
			{#if item.pass}<span>
					Needed: <strong>{requirementText(item, result.threshold)}</strong>
				</span>{/if}
		</p>
		<p>{fix.summary}</p>
		{#if fix.steps?.length}
			<ol class="small">
				{#each fix.steps as step, i (i)}<li>{step}</li>{/each}
			</ol>
		{/if}
		{#if fix.kit.length}<p class="kit"><strong>{kitSentence(fix.kit)}</strong></p>{/if}
		{#if answer?.note}<p class="small muted">Note: {answer.note}</p>{/if}
	</article>
{/if}

<style>
	.fix {
		border-left: 6px solid var(--s);
		display: grid;
		gap: 0.4rem;
	}
	.fix h3 {
		margin: 0.25rem 0 0;
		font-size: 1.05rem;
	}
	.fix h3 a {
		color: var(--ink);
	}
	.measure {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0;
		color: var(--ink-2);
	}
	.kit {
		margin: 0;
		color: var(--fix);
	}
	p {
		margin: 0;
	}
	ol {
		margin: 0;
		padding-left: 1.2rem;
	}
</style>
