<script lang="ts">
	import { describeKitLine, kitSentence } from '../checklist/kit.ts';
	import type { KitLine } from '../checklist/types.ts';

	interface Props {
		kit: KitLine[];
		labels?: Record<string, string>;
		compact?: boolean;
	}
	let { kit, labels = {}, compact = false }: Props = $props();
</script>

{#if kit.length === 0}
	<p class="muted">Nothing to bring: no election-day equipment is needed.</p>
{:else}
	<p class="sentence">{kitSentence(kit)}</p>
	{#if !compact}
		<div class="table-wrap">
			<table class="table">
				<thead>
					<tr><th class="num">Qty</th><th>Item</th><th>Why</th></tr>
				</thead>
				<tbody>
					{#each kit as line (`${line.item}|${line.size ?? ''}`)}
						<tr>
							<td class="num"><strong>{line.qty}</strong></td>
							<td>
								<strong>{line.size ? `${line.size} ` : ''}{line.name}</strong>
								{#if line.note}<div class="small muted">{line.note}</div>{/if}
								<span class="visually-hidden">({describeKitLine(line)})</span>
							</td>
							<td class="small">
								{#each line.for as id, i (id)}{i > 0 ? '; ' : ''}{labels[id] ?? id}{/each}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{/if}

<style>
	.sentence {
		font-size: 1.1rem;
		font-weight: 700;
		background: var(--fix-soft);
		color: var(--ink);
		border-left: 5px solid var(--fix);
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
	}
</style>
