<script lang="ts">
	import Dim from './Dim.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const bars = [106, 126, 146, 166, 186, 206];
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Grates and openings</title>
	<desc id={did}>
		Measure the gaps in any grate on the route; openings must be no wider than 1/2 inch, with long
		slots running across the direction of travel.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="40" width="320" height="120" />
	<path class="dg-ink" d="M0 40 H320 M0 160 H320" />

	<rect class="dg-ink dg-fill-2" x="100" y="54" width="120" height="92" />
	{#each bars as x (x)}
		<rect class="dg-ink-fill" {x} y="56" width="8" height="88" />
	{/each}

	<!-- direction of travel -->
	<g class="dg-ink" style:stroke-width="2.5px">
		<path d="M18 100 H78" />
		<path d="M242 100 H294" />
	</g>
	<polygon class="dg-ink-fill" points="90,100 76,93 76,107" />
	<polygon class="dg-ink-fill" points="306,100 292,93 292,107" />
	<text class="dg-label" x="48" y="84" text-anchor="middle" dominant-baseline="central">walk</text>

	<Dim x1={154} y1={54} x2={166} y2={54} offset={-28} label="≤ 1/2 in" lx={160} ly={13} />
	<text class="dg-label" x="160" y="180" text-anchor="middle" dominant-baseline="central">
		slots run across your path
	</text>
</svg>
