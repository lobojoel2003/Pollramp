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
	<title id={tid}>Parking space width</title>
	<desc id={did}>
		Measure across the accessible space from the center of one painted stripe to the center of the
		other; it must be at least 96 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="180" rx="8" />
	<path class="dg-ink" d="M24 28 H296" />
	<rect class="dg-ink-fill" x="67" y="28" width="6" height="162" />
	<rect class="dg-ink-fill" x="247" y="28" width="6" height="162" />
	<Isa x={138} y={46} size={44} />

	<Dim x1={70} y1={124} x2={250} y2={124} label="≥ 96 in" />
	<text class="dg-label" x="160" y="154" text-anchor="middle" dominant-baseline="central">
		center of stripe
	</text>
	<text class="dg-label" x="160" y="172" text-anchor="middle" dominant-baseline="central">
		to center of stripe
	</text>
</svg>
