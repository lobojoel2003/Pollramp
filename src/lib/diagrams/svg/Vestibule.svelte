<script lang="ts">
	import Dim from './Dim.svelte';

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
	<title id={tid}>Doors in a series</title>
	<desc id={did}>
		Where two doors are in a row, measure the space between them; it must be at least 48 inches plus
		the width of any door that swings into the space.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<text class="dg-label-muted" x="160" y="11" text-anchor="middle" dominant-baseline="central">
		outside
	</text>
	<text class="dg-label-muted" x="160" y="188" text-anchor="middle" dominant-baseline="central">
		inside
	</text>

	<rect class="dg-fill" x="62" y="34" width="196" height="126" />
	<g class="dg-ink dg-fill-2">
		<rect x="50" y="22" width="40" height="12" />
		<rect x="144" y="22" width="126" height="12" />
		<rect x="50" y="160" width="40" height="12" />
		<rect x="144" y="160" width="126" height="12" />
		<rect x="50" y="34" width="12" height="126" />
		<rect x="258" y="34" width="12" height="126" />
	</g>

	<!-- outer door swings into the vestibule; inner door swings away -->
	<path class="dg-muted dg-dash" d="M144 34 A54 54 0 0 1 90 88" />
	<rect class="dg-ink dg-fill-bg" x="90" y="34" width="7" height="54" />
	<path class="dg-muted dg-dash" d="M62 88 H258" />
	<rect class="dg-ink dg-fill-bg" x="90" y="162" width="54" height="7" />

	<Dim x1={210} y1={34} x2={210} y2={88} label="door swing" />
	<Dim x1={210} y1={88} x2={210} y2={160} label="≥ 48 in" />
</svg>
