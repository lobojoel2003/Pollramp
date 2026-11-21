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
	<title id={tid}>Curb ramp</title>
	<desc id={did}>
		Check the curb ramp: ramp slope no steeper than 1:12, side flares no steeper than 1:10, and a
		level landing at the top at least 36 inches deep.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="0" width="320" height="150" />
	<rect class="dg-fill-2" x="0" y="150" width="320" height="50" />
	<text class="dg-label-muted" x="304" y="130" text-anchor="end" dominant-baseline="central">
		sidewalk
	</text>
	<text class="dg-label-muted" x="304" y="180" text-anchor="end" dominant-baseline="central">
		street
	</text>

	<!-- flares -->
	<path class="dg-ink dg-fill-bg" d="M80 150 L120 54 V150 Z M200 54 L240 150 H200 Z" />
	<Hatch
		points={[
			[80, 150],
			[120, 54],
			[120, 150]
		]}
		gap={8}
		dir={-1}
	/>
	<Hatch
		points={[
			[200, 54],
			[240, 150],
			[200, 150]
		]}
		gap={8}
	/>

	<!-- ramp and top landing -->
	<rect class="dg-ink dg-fill-2" x="120" y="54" width="80" height="96" />
	<rect class="dg-muted dg-dash" x="120" y="18" width="80" height="36" />
	<text class="dg-label" x="160" y="36" text-anchor="middle" dominant-baseline="central">
		landing
	</text>
	<path class="dg-muted" style:stroke-width="2px" d="M160 62 V80" />
	<polygon class="dg-muted-fill" points="160,88 154,78 166,78" />
	<text class="dg-label" x="160" y="104" text-anchor="middle" dominant-baseline="central">
		ramp
	</text>
	<text class="dg-label-accent" x="160" y="124" text-anchor="middle" dominant-baseline="central">
		≤ 1:12
	</text>

	<path class="dg-ink" style:stroke-width="3px" d="M0 150 H320" />

	<text class="dg-label" x="14" y="88" dominant-baseline="central">flares</text>
	<text class="dg-label-accent" x="14" y="106" dominant-baseline="central">≤ 1:10</text>
	<path class="dg-muted" d="M62 108 L104 128" />
	<circle class="dg-muted-fill" cx="104" cy="128" r="2.5" />

	<Dim x1={200} y1={54} x2={200} y2={18} offset={44} label="≥ 36 in" />
</svg>
