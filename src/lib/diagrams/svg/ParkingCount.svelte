<script lang="ts">
	import Hatch from './Hatch.svelte';
	import Isa from './Isa.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const spaces = [
		{ cx: 43, n: '1' },
		{ cx: 81, n: '2' },
		{ cx: 119, n: '3' },
		{ cx: 157, n: '4' },
		{ cx: 197, n: '5', isa: true },
		{ cx: 275, n: '6', isa: true }
	];
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Counting parking spaces</title>
	<desc id={did}>
		Count every parking space in the lot, then count how many are accessible spaces marked with the
		wheelchair symbol.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="122" rx="8" />
	<Hatch x={218} y={22} w={36} h={92} gap={9} class="dg-brand-thin" />
	<path
		class="dg-ink"
		d="M24 22 H296 M24 22 V114 M62 22 V114 M100 22 V114 M138 22 V114 M176 22 V114 M296 22 V114"
	/>
	<path class="dg-brand" d="M218 22 V114 M254 22 V114" />

	{#each spaces as s (s.n)}
		{#if s.isa}
			<Isa x={s.cx - 14} y={38} size={28} />
		{/if}
		<text class="dg-label-accent" x={s.cx} y="98" text-anchor="middle" dominant-baseline="central">
			{s.n}
		</text>
	{/each}

	<text class="dg-label" x="24" y="158" dominant-baseline="central">All spaces</text>
	<path
		class="dg-accent"
		d="M128 150 V166 M135 150 V166 M142 150 V166 M149 150 V166 M124 164 L153 152 M163 150 V166"
	/>
	<text class="dg-label-accent" x="178" y="158" dominant-baseline="central">= 6</text>

	<text class="dg-label" x="24" y="184" dominant-baseline="central">Accessible</text>
	<path class="dg-accent" d="M128 176 V192 M135 176 V192" />
	<text class="dg-label-accent" x="150" y="184" dominant-baseline="central">= 2</text>
	<Isa x={186} y={174} size={20} tile={false} />
</svg>
