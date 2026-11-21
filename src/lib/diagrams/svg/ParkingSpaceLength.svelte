<script lang="ts">
	import Dim from './Dim.svelte';
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
	<title id={tid}>Parking space length</title>
	<desc id={did}>
		Measure along the accessible space from the curb or wheel-stop end to the far end of the
		stripes; it must be at least 216 inches (18 ft).
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="180" rx="8" />
	<rect class="dg-fill-2" x="10" y="10" width="20" height="180" />
	<path class="dg-ink" d="M30 10 V190" />
	<text
		class="dg-label-muted"
		x="20"
		y="100"
		text-anchor="middle"
		dominant-baseline="central"
		transform="rotate(-90 20 100)"
	>
		curb
	</text>
	<rect class="dg-ink-fill" x="30" y="37.5" width="240" height="5" />
	<rect class="dg-ink-fill" x="30" y="137.5" width="240" height="5" />
	<Isa x={130} y={70} size={40} />

	<Dim x1={30} y1={140} x2={270} y2={140} offset={28} label="≥ 216 in (18 ft)" />
</svg>
