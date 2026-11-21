<script lang="ts">
	import Hatch from './Hatch.svelte';

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
	<title id={tid}>Door closing speed</title>
	<desc id={did}>
		Open the door to 90 degrees, let go, and time how long the closer takes to bring it to 12
		degrees from closed; it must take at least 5 seconds.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- wall in plan -->
	<rect class="dg-fill-2" x="0" y="150" width="58" height="20" />
	<rect class="dg-fill-2" x="206" y="150" width="114" height="20" />
	<Hatch x={0} y={150} w={58} h={20} gap={9} />
	<Hatch x={206} y={150} w={114} h={20} gap={9} />
	<path class="dg-ink" d="M0 150 H58 V170 H0 M320 150 H206 V170 H320" />

	<!-- door at 12 degrees (ghost) and at 90 degrees with the closer -->
	<rect
		class="dg-muted dg-dash"
		x="64"
		y="146"
		width="136"
		height="8"
		transform="rotate(-12 64 150)"
	/>
	<rect class="dg-ink dg-fill" x="60" y="14" width="8" height="136" />
	<rect class="dg-ink dg-fill-2" x="68" y="114" width="9" height="26" rx="2" />
	<path class="dg-ink" d="M77 120 L94 146" />
	<text class="dg-label-sm" x="84" y="100" dominant-baseline="central">closer</text>

	<!-- timed sweep from 90 to 12 degrees -->
	<path class="dg-accent" d="M64 40 A110 110 0 0 1 171.6 127.1" />
	<polygon class="dg-accent-fill" points="172,129.1 174.5,119.4 165.7,121.2" />
	<text class="dg-label" x="76" y="24" dominant-baseline="central">90°</text>
	<text class="dg-label" x="204" y="134" dominant-baseline="central">12°</text>

	<!-- stopwatch -->
	<rect class="dg-ink dg-fill-2" x="256" y="20" width="12" height="8" rx="2" />
	<circle class="dg-ink dg-fill-bg" style:stroke-width="2.5px" cx="262" cy="52" r="22" />
	<path class="dg-accent-fill" d="M262 52 L262 34 A18 18 0 0 1 271 36.4 Z" />
	<path class="dg-ink" d="M262 52 L262 36" />
	<circle class="dg-ink-fill" cx="262" cy="52" r="2.5" />
	<text class="dg-label-accent" x="258" y="92" text-anchor="middle" dominant-baseline="central">
		≥ 5 seconds
	</text>
	<text class="dg-label" x="258" y="112" text-anchor="middle" dominant-baseline="central">
		from 90° to 12°
	</text>
</svg>
