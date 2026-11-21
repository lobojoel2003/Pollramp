<svelte:options namespace="svg" />

<!-- Digital level lying on a surface: (cx, cy) is the middle of its bottom edge. -->
<script lang="ts">
	interface Props {
		cx: number;
		cy: number;
		length: number;
		angle?: number;
		reading: string;
	}

	let { cx, cy, length, angle = 0, reading }: Props = $props();
	const h = $derived(length / 2);
</script>

<g transform="translate({cx} {cy}) rotate({angle})">
	<rect class="dg-ink dg-fill-2" x={-h} y="-19" width={length} height="18" rx="3" />
	<rect
		class="dg-ink dg-fill-bg"
		style:stroke-width="1.5px"
		x="-23"
		y="-16"
		width="46"
		height="13"
		rx="2"
	/>
	<text class="dg-readout" x="0" y="-9.2" text-anchor="middle" dominant-baseline="central">
		{reading}
	</text>
	{#each [-h + 16, h - 16] as vx (vx)}
		<rect class="dg-muted dg-fill-bg" x={vx - 8} y="-14" width="16" height="8" rx="4" />
		<circle class="dg-muted-fill" cx={vx + 1} cy="-10" r="2.2" />
	{/each}
</g>
