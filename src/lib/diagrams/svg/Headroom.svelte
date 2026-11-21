<script lang="ts">
	import Dim from './Dim.svelte';
	import Person from './Person.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	// Foliage blobs; the lowest bottom edge is y = 36 (80 in above the ground) at x = 104.
	const leaves = [
		[70, 16, 18],
		[104, 14, 22],
		[142, 14, 20],
		[178, 8, 24],
		[218, 12, 20],
		[254, 6, 22],
		[290, 8, 20]
	];
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Headroom</title>
	<desc id={did}>
		Measure from the walking surface up to the lowest overhanging branch, sign or stair underside
		along the route; it must be at least 80 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="180" width="320" height="20" />
	<path class="dg-ink" d="M0 180 H320" />

	<rect class="dg-ink dg-fill-2" x="276" y="10" width="16" height="171" />
	{#each leaves as [cx, cy, r] (cx)}
		<circle class="dg-ink" style:stroke-width="4px" {cx} {cy} {r} />
	{/each}
	{#each leaves as [cx, cy, r] (cx)}
		<circle class="dg-fill-2" {cx} {cy} {r} />
	{/each}

	<Person x={232} y={180} scale={1.8} />

	<Dim x1={104} y1={180} x2={104} y2={36} label="≥ 80 in" />
	<text class="dg-label" x="116" y="52" dominant-baseline="central">lowest point</text>
</svg>
