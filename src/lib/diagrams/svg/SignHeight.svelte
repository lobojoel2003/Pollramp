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
	<title id={tid}>Parking sign height</title>
	<desc id={did}>
		Measure from the ground to the bottom edge of the lowest sign on the post; it must be at least
		60 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="180" width="320" height="20" />
	<path class="dg-ink" d="M0 180 H320" />
	<rect class="dg-ink-fill" x="147" y="18" width="6" height="162" />
	<Isa x={120} y={22} size={60} />
	<rect class="dg-brand-fill" x="104" y="88" width="92" height="34" rx="3" />
	<text class="dg-label-on-brand" x="150" y="98" text-anchor="middle" dominant-baseline="central">
		VAN
	</text>
	<text class="dg-label-on-brand" x="150" y="113" text-anchor="middle" dominant-baseline="central">
		ACCESSIBLE
	</text>

	<text class="dg-label" x="94" y="132" text-anchor="end" dominant-baseline="central">
		bottom of
	</text>
	<text class="dg-label" x="94" y="148" text-anchor="end" dominant-baseline="central">
		lowest sign
	</text>
	<path class="dg-muted" d="M97 130 L103 123" />

	<Dim x1={196} y1={180} x2={196} y2={122} offset={30} label="≥ 60 in" />
</svg>
