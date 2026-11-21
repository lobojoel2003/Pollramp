<script lang="ts">
	import Dim from './Dim.svelte';
	import WheelchairTop from './WheelchairTop.svelte';

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
	<title id={tid}>Clear floor space</title>
	<desc id={did}>
		Check there is a clear, level floor space at least 30 by 48 inches in front of the voting
		machine or table, free of chairs and cords.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-ink dg-fill-2" x="70" y="12" width="180" height="44" rx="3" />
	<rect class="dg-ink dg-fill-bg" x="134" y="20" width="52" height="24" rx="2" />
	<text class="dg-label-muted" x="104" y="34" text-anchor="middle" dominant-baseline="central">
		table
	</text>

	<rect class="dg-wash" x="124" y="56" width="72" height="115" />
	<rect class="dg-accent-thin dg-dash" x="124" y="56" width="72" height="115" />
	<WheelchairTop cx={160} cy={118} scale={2.1} />

	<Dim x1={124} y1={171} x2={196} y2={171} offset={14} label="30 in" />
	<Dim x1={196} y1={171} x2={196} y2={56} offset={30} label="48 in" />
</svg>
