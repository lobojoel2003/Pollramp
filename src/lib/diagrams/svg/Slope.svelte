<script lang="ts">
	import Dim from './Dim.svelte';
	import Level from './Level.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	// Slope surface from (16,170) up to (272,100).
	const angle = (Math.atan2(-70, 256) * 180) / Math.PI;
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Running slope</title>
	<desc id={did}>
		Lay a digital level along the direction of travel and read the slope in percent, or measure rise
		and run: slope = rise ÷ run × 100.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<path class="dg-fill" d="M16 170 L272 100 V170 Z" />
	<path class="dg-ink" d="M0 170 H16 L272 100 H320" />
	<path class="dg-muted" d="M272 100 V170 M0 170 H320" />
	<Level cx={150} cy={133.4} length={116} {angle} reading="4.8%" />

	<text class="dg-label" style:font-size="14px" x="16" y="22" dominant-baseline="central">
		run slope
	</text>
	<text class="dg-label-accent" x="16" y="44" dominant-baseline="central">
		rise ÷ run × 100 = %
	</text>

	<Dim x1={16} y1={170} x2={272} y2={170} offset={16} label="run" />
	<Dim x1={272} y1={170} x2={272} y2={100} offset={24} label="rise" />
</svg>
