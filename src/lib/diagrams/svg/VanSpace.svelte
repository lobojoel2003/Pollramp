<script lang="ts">
	import CarTop from './CarTop.svelte';
	import Dim from './Dim.svelte';
	import Hatch from './Hatch.svelte';

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
	<title id={tid}>Van-accessible space</title>
	<desc id={did}>
		Measure the van space and its access aisle together; they must total at least 192 inches (132 +
		60 or 96 + 96).
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="118" rx="8" />
	<Hatch x={205} y={22} w={75} h={106} gap={11} class="dg-brand-thin" />
	<path class="dg-ink" d="M24 22 H296" />
	<rect class="dg-ink-fill" x="37.5" y="22" width="5" height="106" />
	<path class="dg-brand" d="M205 22 V128 M280 22 V128" />
	<CarTop cx={122} cy={76} w={70} l={96} van />
	<text class="dg-label dg-halo" x="242.5" y="76" text-anchor="middle" dominant-baseline="central">
		aisle
	</text>

	<path class="dg-muted" d="M205 131 V150" />
	<text class="dg-label-muted" x="122" y="142" text-anchor="middle" dominant-baseline="central">
		132 in
	</text>
	<text class="dg-label-muted" x="242.5" y="142" text-anchor="middle" dominant-baseline="central">
		60 in
	</text>
	<Dim x1={40} y1={128} x2={280} y2={128} offset={34} label="≥ 192 in" />
	<text class="dg-label" x="160" y="186" text-anchor="middle" dominant-baseline="central">
		space + aisle: 132 + 60 or 96 + 96
	</text>
</svg>
