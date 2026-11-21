<script lang="ts">
	import Dim from './Dim.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const domes: [number, number][] = [];
	for (let y = 102.5; y < 150; y += 9) for (let x = 66; x < 180; x += 9) domes.push([x, y]);
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Detectable warning</title>
	<desc id={did}>
		Check the curb ramp has a truncated-dome warning strip at the street edge running the full width
		of the ramp and 36 inches deep.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="0" width="320" height="150" />
	<rect class="dg-fill-2" x="0" y="150" width="320" height="50" />
	<text class="dg-label-muted" x="306" y="20" text-anchor="end" dominant-baseline="central">
		sidewalk
	</text>
	<text class="dg-label-muted" x="306" y="188" text-anchor="end" dominant-baseline="central">
		street
	</text>

	<path class="dg-ink" d="M34 150 L60 30 M180 30 L206 150" />
	<rect class="dg-ink dg-fill-2" x="60" y="30" width="120" height="120" />
	<text class="dg-label" x="120" y="62" text-anchor="middle" dominant-baseline="central">ramp</text>

	<rect class="dg-fill-bg" x="60" y="96" width="120" height="54" />
	<rect class="dg-wash" x="60" y="96" width="120" height="54" />
	{#each domes as [cx, cy], i (i)}
		<circle class="dg-ink-fill" {cx} {cy} r="2.6" />
	{/each}
	<rect class="dg-accent" x="60" y="96" width="120" height="54" />
	<path class="dg-ink" style:stroke-width="3px" d="M0 150 H320" />

	<Dim x1={60} y1={150} x2={180} y2={150} offset={22} label="full width" />
	<Dim
		x1={180}
		y1={150}
		x2={180}
		y2={96}
		offset={48}
		label="36 in deep"
		lx={236}
		ly={123}
		anchor="start"
	/>
</svg>
