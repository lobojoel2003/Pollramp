<svelte:options namespace="svg" />

<!--
	Side-view person pictogram facing right (left with `flip`), drawn in inches:
	(x, y) is the floor point under the hips and `scale` is px per inch.
-->
<script lang="ts">
	interface Props {
		x: number;
		y: number;
		scale?: number;
		flip?: boolean;
		pose?: 'stand' | 'walk' | 'sit';
		cane?: boolean;
	}

	let { x, y, scale = 1.8, flip = false, pose = 'walk', cane = false }: Props = $props();

	const shapes = $derived.by(() => {
		if (pose === 'sit') {
			return {
				head: [1.5, -47.5],
				torso: 'M0,-40 L0,-21',
				legs: 'M0,-19 L14,-19 L15,-1.5 L19,-1.5',
				arms: 'M0,-38 L6,-28.5 L13,-26.5',
				hand: [13, -26.5]
			};
		}
		if (pose === 'stand') {
			return {
				head: [1.2, -63],
				torso: 'M0,-55 L0,-34',
				legs: 'M0,-32 L-4.5,-1.5 L0,-1.5 M0,-32 L4.5,-1.5 L9,-1.5',
				arms: 'M0.5,-53 L3,-41.5 L10.5,-38.5',
				hand: [10.5, -38.5]
			};
		}
		return {
			head: [1.5, -63],
			torso: 'M0,-55 L0,-34',
			legs: 'M0,-32 L6,-17.5 L9.5,-1.5 L13.5,-1.5 M0,-32 L-3,-17 L-9,-3',
			arms: 'M0,-53 L5,-42.5 L8.5,-34 M0,-53 L-4.5,-43 L-6.5,-35',
			hand: [8.5, -34]
		};
	});
</script>

<g transform="translate({x} {y}) scale({flip ? -scale : scale} {scale})">
	{#if cane}
		<path
			class="dg-ink"
			vector-effect="non-scaling-stroke"
			d="M{shapes.hand[0]},{shapes.hand[1]} L{shapes.hand[0] + 22},-0.5"
		/>
	{/if}
	<g class="dg-figure">
		<path style:stroke-width="4.4px" d={shapes.legs} />
		<path style:stroke-width="6.4px" d={shapes.torso} />
		<path style:stroke-width="3.2px" d={shapes.arms} />
	</g>
	<circle class="dg-ink-fill" cx={shapes.head[0]} cy={shapes.head[1]} r="4.7" />
</g>
