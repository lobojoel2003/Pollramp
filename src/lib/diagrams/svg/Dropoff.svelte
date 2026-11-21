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
	<title id={tid}>Passenger drop-off</title>
	<desc id={did}>
		Check the drop-off has an access aisle beside the car at the same level as the car; measure it:
		at least 60 inches wide and at least 20 feet long.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill-2" x="0" y="0" width="320" height="36" />
	<text class="dg-label-muted" x="306" y="18" text-anchor="end" dominant-baseline="central">
		sidewalk
	</text>
	<rect class="dg-fill" x="0" y="36" width="320" height="164" />
	<path class="dg-ink" style:stroke-width="3px" d="M0 36 H320" />

	<Hatch x={40} y={40} w={240} h={60} gap={12} class="dg-brand-thin" />
	<rect class="dg-brand" x="40" y="40" width="240" height="60" />
	<text class="dg-label dg-halo" x="182" y="62" text-anchor="middle" dominant-baseline="central">
		access aisle
	</text>
	<text class="dg-label dg-halo" x="182" y="79" text-anchor="middle" dominant-baseline="central">
		at street level
	</text>
	<CarTop cx={160} cy={137} w={60} l={156} rotate={90} />

	<Dim x1={72} y1={100} x2={72} y2={40} label="≥ 60 in" />
	<Dim x1={40} y1={100} x2={280} y2={100} offset={82} label="≥ 20 ft" />
</svg>
