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
	<title id={tid}>Access aisle width</title>
	<desc id={did}>
		Measure across the striped access aisle next to the accessible space; it must be at least 60
		inches wide.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="140" rx="8" />
	<Hatch x={140} y={24} w={75} h={126} gap={11} class="dg-brand-thin" />
	<path class="dg-ink" d="M24 24 H296" />
	<rect class="dg-ink-fill" x="37.5" y="24" width="5" height="126" />
	<rect class="dg-ink-fill" x="287.5" y="24" width="5" height="126" />
	<path class="dg-brand" d="M140 24 V150 M215 24 V150" />
	<Isa x={72} y={60} size={36} />

	<text class="dg-label dg-halo" x="177.5" y="78" text-anchor="middle" dominant-baseline="central">
		access
	</text>
	<text class="dg-label dg-halo" x="177.5" y="95" text-anchor="middle" dominant-baseline="central">
		aisle
	</text>

	<Dim x1={140} y1={150} x2={215} y2={150} offset={24} label="≥ 60 in" />
</svg>
