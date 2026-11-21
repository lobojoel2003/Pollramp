<script lang="ts">
	import Person from './Person.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const FLOOR = 172;
	const chairs = [62, 118];
	const chair = (x: number) =>
		`M${x - 12} ${FLOOR - 27} H${x + 12} M${x - 11} ${FLOOR} L${x + 10} ${FLOOR - 27} M${x + 11} ${FLOOR} L${x - 10} ${FLOOR - 27} M${x - 12} ${FLOOR - 27} L${x - 15} ${FLOOR - 62}`;
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Seating in line</title>
	<desc id={did}>
		Check there are chairs along the line where voters wait, for people who cannot stand for long.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y={FLOOR} width="320" height={200 - FLOOR} />
	<path class="dg-ink" d="M0 {FLOOR} H320" />

	<!-- check-in table -->
	<rect class="dg-ink dg-fill-2" x="270" y="118" width="50" height="6" />
	<path class="dg-ink" d="M278 124 V{FLOOR} M312 124 V{FLOOR}" />
	<text class="dg-label-sm" x="312" y="104" text-anchor="end" dominant-baseline="central">
		check-in
	</text>

	<!-- people waiting in line -->
	{#each [172, 206] as x (x)}
		<Person {x} y={FLOOR} scale={1.5} pose="stand" />
	{/each}
	<Person x={240} y={FLOOR} scale={1.5} />

	<!-- folding chairs: one taken, one free -->
	{#each chairs as x (x)}
		<path class="dg-brand" style:stroke-width="3px" d={chair(x)} />
		<rect class="dg-brand-fill" x={x - 17} y={FLOOR - 64} width="6" height="18" rx="2" />
	{/each}
	<Person x={120} y={FLOOR} scale={1.5} pose="sit" />

	<text class="dg-label" x="90" y="186" text-anchor="middle" dominant-baseline="central">
		chairs along the line
	</text>
</svg>
