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
	<title id={tid}>Door threshold</title>
	<desc id={did}>
		Measure from the floor to the top of the door threshold; it must be no more than 1/2 inch high,
		with beveled edges.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- floor in section -->
	<rect class="dg-fill" x="0" y="150" width="320" height="50" />
	<Hatch x={0} y={150} w={320} h={50} gap={12} />
	<path class="dg-ink" d="M0 150 H320" />

	<!-- door leaf above the threshold -->
	<rect class="dg-ink dg-fill-2" x="150" y="-4" width="20" height="120" />
	<text class="dg-label-muted" x="182" y="40" dominant-baseline="central">door</text>

	<path class="dg-ink dg-fill-2" d="M100 150 L132 126 H188 L220 150 Z" />
	<path class="dg-muted dg-dash" d="M190 126 H240" />

	<text class="dg-label" x="20" y="100" dominant-baseline="central">beveled edge</text>
	<path class="dg-muted" d="M64 110 L112 138" />
	<circle class="dg-muted-fill" cx="114" cy="139" r="2.5" />

	<Dim x1={236} y1={150} x2={236} y2={126} label="≤ 1/2 in" lx={248} ly={138} anchor="start" />
</svg>
