<script lang="ts">
	import WheelchairTop from './WheelchairTop.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const keys: [number, number][] = [];
	for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) keys.push([113 + c * 7.5, 74 + r * 6]);
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Accessible voting station</title>
	<desc id={did}>
		Check the accessible voting machine is set up on a table a wheelchair user can pull up to, with
		headphones, a tactile keypad and a privacy screen.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- table in plan -->
	<rect class="dg-ink dg-fill-2" x="24" y="24" width="200" height="68" rx="3" />

	<!-- voting machine screen and tactile keypad -->
	<rect class="dg-ink dg-fill-bg" x="98" y="38" width="52" height="26" rx="2" />
	<path class="dg-muted" d="M106 46 H142 M106 52 H136 M106 58 H140" />
	<rect class="dg-ink dg-fill" x="107" y="69" width="34" height="16" rx="2" />
	{#each keys as [cx, cy], i (i)}
		<circle class="dg-ink-fill" {cx} {cy} r="1.8" />
	{/each}

	<!-- privacy screen around the machine -->
	<path class="dg-ink" style:stroke-width="4px" d="M74 84 L86 32 H162 L174 84" />

	<!-- headphones -->
	<path class="dg-ink" style:stroke-width="3px" d="M40 60 A12 12 0 0 1 64 60" />
	<rect class="dg-ink-fill" x="35" y="56" width="9" height="15" rx="4" />
	<rect class="dg-ink-fill" x="60" y="56" width="9" height="15" rx="4" />
	<text class="dg-label-sm" x="52" y="108" text-anchor="middle" dominant-baseline="central">
		headphones
	</text>

	<WheelchairTop cx={124} cy={148} scale={2} />

	<text class="dg-label-sm" x="240" y="36" dominant-baseline="central">privacy</text>
	<text class="dg-label-sm" x="240" y="51" dominant-baseline="central">screen</text>
	<path class="dg-muted" d="M236 44 L172 66" />
	<text class="dg-label-sm" x="240" y="104" dominant-baseline="central">tactile</text>
	<text class="dg-label-sm" x="240" y="119" dominant-baseline="central">keypad</text>
	<path class="dg-muted" d="M236 108 L143 80" />
</svg>
