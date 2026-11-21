<script lang="ts">
	import Level from './Level.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	// Top of the walkway runs from (36,112) down to (284,128).
	const angle = (Math.atan2(16, 248) * 180) / Math.PI;
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Cross slope</title>
	<desc id={did}>
		Lay the level across the path, side to side, at right angles to the direction of travel; the
		cross slope must be no steeper than 1:48 (2%).
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<text class="dg-label" x="160" y="22" text-anchor="middle" dominant-baseline="central">
		Lay the level across the path
	</text>
	<text class="dg-label-accent" x="160" y="46" text-anchor="middle" dominant-baseline="central">
		cross slope ≤ 1:48 (2%)
	</text>

	<path class="dg-fill" d="M0 112 H36 L284 128 H320 V200 H0 Z" />
	<path class="dg-ink dg-fill-2" d="M36 112 L284 128 V146 L36 130 Z" />
	<path class="dg-ink" d="M0 112 H36 M284 128 H320" />
	<Level cx={160} cy={120} length={200} {angle} reading="2.0%" />

	<text class="dg-label-muted" x="160" y="176" text-anchor="middle" dominant-baseline="central">
		cross-section: you walk into the page
	</text>
</svg>
