<script lang="ts">
	import Dim from './Dim.svelte';
	import Hatch from './Hatch.svelte';
	import Wheelchair from './Wheelchair.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	// 2.6 px per inch above the floor at y = 180.
	const at = (inches: number) => 180 - inches * 2.6;
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Reach range</title>
	<desc id={did}>
		Measure the height of controls, slots and items voters must reach; they must be between 15 and
		48 inches above the floor.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-wash" x="16" y={at(48)} width="272" height={at(15) - at(48)} />
	<path class="dg-accent-thin dg-dash" d="M16 {at(48)} H288 M16 {at(15)} H288" />
	<text class="dg-label" x="150" y={at(31)} text-anchor="middle" dominant-baseline="central">
		reach range
	</text>

	<rect class="dg-fill" x="0" y="180" width="320" height="20" />
	<rect class="dg-fill-2" x="288" y="0" width="32" height="180" />
	<Hatch x={288} y={0} w={32} h={180} gap={10} />
	<path class="dg-ink" d="M0 180 H288 V0" />
	<rect class="dg-ink dg-fill-2" x="280" y={at(44) - 7} width="8" height="14" rx="1" />

	<Wheelchair x={219} y={180} hand={[26.4, -44]} />

	<Dim x1={36} y1={180} x2={36} y2={at(48)} label="48 in" />
	<Dim x1={84} y1={180} x2={84} y2={at(15)} label="15 in" />
</svg>
