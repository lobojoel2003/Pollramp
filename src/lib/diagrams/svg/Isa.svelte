<svelte:options namespace="svg" />

<!--
	International Symbol of Accessibility. By default a brand tile with a knocked-out figure;
	`tile={false}` draws the figure alone in the brand colour, and `knockout` draws the figure
	alone in the background colour (for use on a brand-coloured sign).
-->
<script lang="ts">
	interface Props {
		x: number;
		y: number;
		size?: number;
		tile?: boolean;
		knockout?: boolean;
	}

	let { x, y, size = 40, tile = true, knockout = false }: Props = $props();
</script>

<g
	class="dg-isa"
	class:dg-isa-tile={tile || knockout}
	transform="translate({x} {y}) scale({size / 40})"
>
	{#if tile && !knockout}
		<rect class="dg-isa-bg" width="40" height="40" rx="5" />
	{/if}
	<circle class="dg-isa-fill" cx="19.6" cy="8.2" r="3.7" />
	<path class="dg-isa-stroke" style:stroke-width="4px" d="M18.6 14 L17.8 24.6 H26.4 L29.6 32.6" />
	<path class="dg-isa-stroke" style:stroke-width="3.4px" d="M18.4 18.4 H25.4" />
	<path class="dg-isa-stroke" style:stroke-width="3.2px" d="M12.9 19.5 A9 9 0 1 0 24.5 31.1" />
</g>
