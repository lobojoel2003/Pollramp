<script lang="ts">
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
	<title id={tid}>Door clear width</title>
	<desc id={did}>
		Open the door to 90 degrees and measure from the face of the door to the stop on the opposite
		jamb; the clear width must be at least 32 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- wall in plan, with jambs and the latch-side stop -->
	<rect class="dg-fill-2" x="0" y="150" width="90" height="22" />
	<rect class="dg-fill-2" x="230" y="150" width="90" height="22" />
	<Hatch x={0} y={150} w={90} h={22} gap={9} />
	<Hatch x={230} y={150} w={90} h={22} gap={9} />
	<path class="dg-ink" d="M0 150 H90 V172 H0 M320 150 H230 V172 H320" />
	<rect class="dg-ink dg-fill" x="90" y="148" width="8" height="26" />
	<rect class="dg-ink dg-fill" x="222" y="148" width="8" height="26" />
	<rect class="dg-ink-fill" x="214" y="150" width="8" height="8" />

	<!-- door open to 90 degrees -->
	<path class="dg-muted dg-dash" d="M102 36 A114 114 0 0 1 216 150" />
	<rect class="dg-ink dg-fill" x="98" y="36" width="8" height="114" />
	<text class="dg-label" x="114" y="22" dominant-baseline="central">door open to 90°</text>
	<text class="dg-label-muted" x="246" y="134" dominant-baseline="central">stop</text>
	<path class="dg-muted" d="M242 136 L222 152" />

	<Dim x1={106} y1={148} x2={214} y2={148} offset={-42} label="≥ 32 in" />
	<text class="dg-label" x="160" y="128" text-anchor="middle" dominant-baseline="central">
		clear width
	</text>
</svg>
