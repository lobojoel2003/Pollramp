<svelte:options namespace="svg" />

<!-- Pass (check mark) or fail (cross) badge centred on (x, y). -->
<script lang="ts">
	interface Props {
		x: number;
		y: number;
		ok: boolean;
		r?: number;
	}

	let { x, y, ok, r = 11 }: Props = $props();
	const k = $derived(r / 11);
</script>

<g transform="translate({x} {y}) scale({k})">
	<circle class={ok ? 'dg-ok-fill' : 'dg-bad-fill'} r="11" />
	{#if ok}
		<path class="dg-mark-glyph" d="M-5 0.5 L-1.5 4.5 L5.5 -4" />
	{:else}
		<path class="dg-mark-glyph" d="M-4.5 -4.5 L4.5 4.5 M4.5 -4.5 L-4.5 4.5" />
	{/if}
</g>
