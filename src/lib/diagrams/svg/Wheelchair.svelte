<svelte:options namespace="svg" />

<!--
	Side view of a seated wheelchair user facing right (or left with `flip`).
	Drawn in inches: (x, y) is the floor point under the rear axle and `scale` is px per inch.
	`hand` is where the forward hand reaches, in inches relative to (x, y) with up negative.
-->
<script lang="ts">
	interface Props {
		x: number;
		y: number;
		scale?: number;
		flip?: boolean;
		hand?: [number, number];
	}

	let { x, y, scale = 2.6, flip = false, hand }: Props = $props();

	const arm = $derived(
		hand ? `M0.5,-41.5 L${hand[0]},${hand[1]}` : 'M0.5,-41.5 L5,-31 L13.5,-28.5'
	);
</script>

<g transform="translate({x} {y}) scale({flip ? -scale : scale} {scale})">
	<!-- chair -->
	<g class="dg-ink" vector-effect="non-scaling-stroke">
		<path vector-effect="non-scaling-stroke" d="M-3.5,-19.5 L-5,-36.5 L-9,-37.5" />
		<path vector-effect="non-scaling-stroke" d="M-3,-19.5 H16.5 L18.5,-6.5 H25" />
		<path vector-effect="non-scaling-stroke" d="M17.2,-8.5 L17,-3" />
		<circle vector-effect="non-scaling-stroke" class="dg-fill-bg" cx="17" cy="-3" r="3" />
	</g>
	<!-- person -->
	<g class="dg-figure">
		<path style:stroke-width="4.4px" d="M1,-22 L18,-23 L20,-8.5 L24.5,-8.5" />
		<path style:stroke-width="6px" d="M1,-23 L0.2,-41" />
		<path style:stroke-width="3.2px" d={arm} />
	</g>
	<circle class="dg-ink-fill" cx="2.6" cy="-49.5" r="4.6" />
	<!-- rear wheel on top so the rim reads clearly -->
	<circle
		class="dg-ink"
		vector-effect="non-scaling-stroke"
		cx="0"
		cy="-12"
		r="12"
		style:stroke-width="2.5px"
	/>
	<circle
		class="dg-ink"
		vector-effect="non-scaling-stroke"
		cx="0"
		cy="-12"
		r="9.5"
		style:stroke-width="1.25px"
	/>
	<circle class="dg-ink-fill" cx="0" cy="-12" r="1.6" />
</g>
