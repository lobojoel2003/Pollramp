<svelte:options namespace="svg" />

<!--
	Top view of a wheelchair user, facing up (toward -y) before `rotate` is applied.
	Drawn in inches about the seat centre (cx, cy); `scale` is px per inch.
-->
<script lang="ts">
	interface Props {
		cx: number;
		cy: number;
		scale?: number;
		rotate?: number;
	}

	let { cx, cy, scale = 2.4, rotate = 0 }: Props = $props();
</script>

<g transform="translate({cx} {cy}) rotate({rotate}) scale({scale})">
	<!-- wheels and casters -->
	<g class="dg-ink-fill">
		<rect x="-13" y="-6" width="2.6" height="24" rx="1.2" />
		<rect x="10.4" y="-6" width="2.6" height="24" rx="1.2" />
		<rect x="-9" y="-19" width="2" height="5" rx="1" />
		<rect x="7" y="-19" width="2" height="5" rx="1" />
	</g>
	<!-- frame, seat, footplate -->
	<g class="dg-ink">
		<rect
			vector-effect="non-scaling-stroke"
			class="dg-fill-2"
			x="-10"
			y="-11"
			width="20"
			height="21"
			rx="2"
		/>
		<rect
			vector-effect="non-scaling-stroke"
			class="dg-fill-2"
			x="-7.5"
			y="-24"
			width="15"
			height="4"
			rx="1"
		/>
		<path
			vector-effect="non-scaling-stroke"
			d="M-10,10 V14 M10,10 V14 M-7,-11 L-6,-20 M7,-11 L6,-20"
		/>
	</g>
	<!-- person: legs, shoulders, head -->
	<g class="dg-figure">
		<path style:stroke-width="4.6px" d="M-3.6,0 V-17 M3.6,0 V-17" />
	</g>
	<rect class="dg-ink-fill" x="-10.5" y="1" width="21" height="7" rx="3.5" />
	<circle class="dg-ink dg-fill-bg" vector-effect="non-scaling-stroke" cx="0" cy="3.5" r="4.4" />
</g>
