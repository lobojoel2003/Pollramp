<script lang="ts">
	import Dim from './Dim.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	// Ramp surface from (0,176) up to (320,128); rail centreline 89 px above it.
	const surf = (x: number) => 176 - 0.15 * x;
	const rail = (x: number) => surf(x) - 89;
	const posts = [40, 150, 260].map((x) => `M${x} ${surf(x)} V${rail(x)}`).join(' ');
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Handrail height</title>
	<desc id={did}>
		Measure straight up from the ramp surface to the top of the handrail; it must be between 34 and
		38 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<path class="dg-fill" d="M0 {surf(0)} L320 {surf(320)} V200 H0 Z" />
	<path class="dg-ink" d="M0 {surf(0)} L320 {surf(320)}" />
	<path class="dg-ink" style:stroke-width="3px" d={posts} />
	<path class="dg-ink" style:stroke-width="6px" d="M0 {rail(0)} L320 {rail(320)}" />

	<text class="dg-label" x="196" y="38" text-anchor="end" dominant-baseline="central">
		top of rail
	</text>
	<text class="dg-label" x="16" y="188" dominant-baseline="central">ramp surface</text>
	<Dim x1={205} y1={surf(205)} x2={205} y2={rail(205) - 3} label="34–38 in" />
</svg>
