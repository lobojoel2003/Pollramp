<script lang="ts">
	import Dim from './Dim.svelte';
	import Hatch from './Hatch.svelte';
	import Isa from './Isa.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Van vertical clearance</title>
	<desc id={did}>
		Measure from the ground straight up to the lowest overhead beam, pipe or sign on the van route;
		it must be at least 98 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- ceiling slab and beam -->
	<rect class="dg-fill-2" x="0" y="0" width="320" height="12" />
	<rect class="dg-ink dg-fill-2" x="206" y="-2" width="88" height="42" />
	<Hatch x={207} y={12} w={86} h={27} gap={8} />
	<path class="dg-ink" d="M0 12 H206 M294 12 H320" />

	<!-- ground -->
	<rect class="dg-fill" x="0" y="178" width="320" height="22" />
	<path class="dg-ink" d="M0 178 H320" />

	<!-- van -->
	<path class="dg-ink dg-fill-2" d="M26 152 V70 Q26 62 34 62 H166 L192 100 L198 106 V152 Z" />
	<path class="dg-muted-fill" d="M168 70 L186 98 H160 V70 Z" />
	<rect class="dg-muted-fill" x="110" y="70" width="40" height="28" rx="2" />
	<path class="dg-muted" d="M100 70 V150" />
	<Isa x={52} y={84} size={26} />
	{#each [62, 164] as wx (wx)}
		<circle class="dg-ink-fill" cx={wx} cy="164" r="14" />
		<circle class="dg-fill-bg" cx={wx} cy="164" r="5" />
	{/each}

	<Dim x1={250} y1={178} x2={250} y2={40} label="≥ 98 in" />
	<text class="dg-label" x="262" y="58" dominant-baseline="central">lowest</text>
	<text class="dg-label" x="262" y="74" dominant-baseline="central">point</text>
</svg>
