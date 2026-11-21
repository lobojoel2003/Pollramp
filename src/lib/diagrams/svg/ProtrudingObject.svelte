<script lang="ts">
	import Dim from './Dim.svelte';
	import Hatch from './Hatch.svelte';
	import Person from './Person.svelte';

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
	<title id={tid}>Protruding objects</title>
	<desc id={did}>
		For wall-mounted objects whose bottom edge is between 27 and 80 inches above the floor, measure
		how far they stick out from the wall; it must be no more than 4 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- zone a cane sweeping the floor cannot detect -->
	<rect class="dg-wash" x="60" y="36" width="260" height="95" />
	<path class="dg-accent-thin dg-dash" d="M60 36 H320 M60 131 H320" />
	<text class="dg-label-accent" x="66" y="24" dominant-baseline="central">80 in</text>
	<text class="dg-label-accent" x="66" y="144" dominant-baseline="central">27 in</text>
	<text class="dg-label dg-halo" x="168" y="112" text-anchor="middle" dominant-baseline="central">
		a cane can't detect
	</text>

	<rect class="dg-fill" x="0" y="180" width="320" height="20" />
	<rect class="dg-fill-2" x="36" y="0" width="24" height="180" />
	<Hatch x={36} y={0} w={24} h={180} gap={10} />
	<path class="dg-ink" d="M60 0 V180 M0 180 H320" />

	<rect class="dg-ink dg-fill-2" x="60" y="70" width="48" height="30" rx="2" />
	<Dim x1={60} y1={70} x2={108} y2={70} offset={-16} label="≤ 4 in" />

	<path class="dg-muted dg-dash" d="M112 176 H214" />
	<Person x={272} y={180} scale={1.75} flip cane />
</svg>
