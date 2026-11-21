<script lang="ts">
	import Dim from './Dim.svelte';
	import Mark from './Mark.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const panels = [
		{ x: 12, value: '≤ 1/4 in', note: 'OK', ok: true, d: 'M22 150 H58 V146 H96' },
		{ x: 113, value: '≤ 1/2 in', note: 'beveled', ok: true, d: 'M123 150 H152 L166 142 H197' },
		{ x: 214, value: '> 1/2 in', note: 'needs a ramp', ok: false, d: 'M224 150 H262 V134 H298' }
	];
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Change in level</title>
	<desc id={did}>
		Measure the height of any step, lip or crack edge on the route: up to 1/4 inch is OK, up to 1/2
		inch must be beveled, and more than 1/2 inch needs a ramp.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<path class="dg-fill" d="M16 100 H168 V66 H304 V108 H16 Z" />
	<path class="dg-ink" d="M16 100 H168 V66 H304" />
	<Dim
		x1={168}
		y1={100}
		x2={168}
		y2={66}
		offset={-22}
		label="height"
		lx={138}
		ly={83}
		anchor="end"
	/>

	{#each panels as p (p.x)}
		<rect class="dg-muted" x={p.x} y="118" width="94" height="78" rx="6" />
		<path class="dg-fill" d="{p.d} V156 H{p.x + 10} Z" />
		<path class="dg-ink" d={p.d} />
		<Mark x={p.x + 82} y={130} ok={p.ok} r={9} />
		<text
			class="dg-label-accent"
			x={p.x + 47}
			y="168"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{p.value}
		</text>
		<text class="dg-label" x={p.x + 47} y="185" text-anchor="middle" dominant-baseline="central">
			{p.note}
		</text>
	{/each}
</svg>
