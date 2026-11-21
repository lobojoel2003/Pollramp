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
	<title id={tid}>Route width</title>
	<desc id={did}>
		Find the narrowest point of the walkway or hallway, such as beside a planter, post or table, and
		measure the clear width there; it must be at least 36 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- wall above, walkway, edge below -->
	<rect class="dg-fill-2" x="0" y="0" width="320" height="48" />
	<Hatch x={0} y={0} w={320} h={48} gap={12} />
	<rect class="dg-fill" x="0" y="48" width="320" height="102" />
	<path class="dg-ink" d="M0 48 H320 M0 150 H320" />
	<path
		class="dg-brand-thin"
		d="M22 182 q-1 -6 -5 -10 M22 182 q0 -7 1 -12 M22 182 q1 -6 6 -9 M58 172 q-1 -6 -5 -10 M58 172 q0 -7 1 -12 M58 172 q1 -6 6 -9 M104 186 q-1 -6 -5 -10 M104 186 q0 -7 1 -12 M104 186 q1 -6 6 -9 M246 180 q-1 -6 -5 -10 M246 180 q0 -7 1 -12 M246 180 q1 -6 6 -9 M292 170 q-1 -6 -5 -10 M292 170 q0 -7 1 -12 M292 170 q1 -6 6 -9 M308 190 q-1 -6 -5 -10 M308 190 q0 -7 1 -12 M308 190 q1 -6 6 -9"
	/>
	<text class="dg-label-muted" x="180" y="176" text-anchor="middle" dominant-baseline="central">
		grass
	</text>

	<!-- planter narrowing the route -->
	<rect class="dg-ink dg-fill-2" x="148" y="40" width="64" height="56" rx="3" />
	<circle class="dg-brand dg-fill" cx="180" cy="68" r="20" />
	<path class="dg-brand-thin" d="M180 52 V84 M166 60 L194 76 M166 76 L194 60" />

	<!-- direction of travel -->
	<path class="dg-muted" style:stroke-width="2px" d="M22 123 H116" />
	<polygon class="dg-muted-fill" points="126,123 114,117 114,129" />

	<Dim x1={180} y1={96} x2={180} y2={150} label="≥ 36 in" />
	<text class="dg-label" x="222" y="116" dominant-baseline="central">narrowest</text>
	<text class="dg-label" x="222" y="132" dominant-baseline="central">point</text>
</svg>
