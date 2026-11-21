<script lang="ts">
	import { aggregateKits, describeKitLine, kitSentence } from '#lib/checklist/kit.ts';
	import { app } from '#lib/client/store.svelte.ts';

	const perSite = $derived(
		app.activeSites
			.map((site) => ({ site, survey: app.latestSubmitted(site.id) }))
			.filter((r) => r.survey?.result && r.survey.result.kit.length > 0)
			.map((r) => ({ siteId: r.site.id, siteName: r.site.name, kit: r.survey!.result!.kit }))
	);
	const totals = $derived(aggregateKits(perSite));
	const surveyed = $derived(app.activeSites.filter((s) => app.latestSubmitted(s.id)).length);
	let view = $state<'totals' | 'sites'>('totals');
</script>

<svelte:head><title>Election-day kit · Pollramp</title></svelte:head>

<div class="container page stack" style="--gap: 1.5rem">
	<div class="spread">
		<div>
			<h1>Election-day kit</h1>
			<p class="muted">
				Everything poll workers need to make sites accessible on election day, from the latest
				submitted survey at {surveyed} of {app.activeSites.length} sites.
			</p>
		</div>
		<div class="cluster no-print">
			<a class="btn" href="/api/export/kit.csv" download>Download CSV</a>
			<button class="btn btn-primary" type="button" onclick={() => print()}>Print</button>
		</div>
	</div>

	<div class="segmented no-print" role="group" aria-label="View">
		<button type="button" aria-pressed={view === 'totals'} onclick={() => (view = 'totals')}>
			Office totals
		</button>
		<button type="button" aria-pressed={view === 'sites'} onclick={() => (view = 'sites')}>
			Packing list by site
		</button>
	</div>

	{#if totals.length === 0}
		<div class="card">
			<h2>Nothing needed yet</h2>
			<p class="muted">
				When surveys find barriers that can be fixed on election day, the equipment shows up here.
			</p>
		</div>
	{:else if view === 'totals'}
		<section class="card" aria-labelledby="totals-h">
			<h2 id="totals-h">What to buy or pull from storage</h2>
			<div class="table-wrap">
				<table class="table">
					<thead><tr><th class="num">Total</th><th>Item</th><th>Sites</th></tr></thead>
					<tbody>
						{#each totals as line (`${line.item}|${line.size ?? ''}`)}
							<tr>
								<td class="num"><strong class="qty">{line.qty}</strong></td>
								<td><strong>{line.size ? `${line.size} ` : ''}{line.name}</strong></td>
								<td class="small">
									{#each line.sites as s, i (s.siteId)}{i ? ', ' : ''}<a
											href={`/sites/${s.siteId}`}
										>
											{s.siteName}
										</a>
										({s.qty}){/each}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{:else}
		<div class="grid-auto" style="--min: 320px">
			{#each perSite as s (s.siteId)}
				<section class="card stack packing" aria-labelledby={`k-${s.siteId}`}>
					<h2 id={`k-${s.siteId}`}><a href={`/sites/${s.siteId}`}>{s.siteName}</a></h2>
					<p class="sentence">{kitSentence(s.kit)}</p>
					<ul class="checklist">
						{#each s.kit as line (`${line.item}|${line.size ?? ''}`)}
							<li><span class="box" aria-hidden="true"></span>{describeKitLine(line)}</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.qty {
		font-size: 1.3rem;
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
	.sentence {
		color: var(--ink-2);
	}
	.checklist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}
	.checklist li {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
	}
	.box {
		flex: none;
		width: 1.1rem;
		height: 1.1rem;
		border: 2px solid var(--ink-2);
		border-radius: 4px;
		margin-top: 0.2rem;
	}
	.packing h2 a {
		color: var(--ink);
	}
	@media print {
		.packing {
			break-inside: avoid;
		}
	}
</style>
