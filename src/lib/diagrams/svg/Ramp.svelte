<script lang="ts">
	import Dim from './Dim.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	// Ramp surface rises from (84,172) to (212,116); handrail runs 30 px above it.
	const k = 56 / 128;
	const surf = (x: number) => 172 - k * (x - 84);
	const angle = (Math.atan2(-56, 128) * 180) / Math.PI;
	const posts = [98, 200].map((x) => `M${x} ${surf(x)} V${surf(x) - 30}`).join(' ');
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Ramp</title>
	<desc id={did}>
		Check the ramp: slope no steeper than 1:12, no more than 30 inches of rise per run, level
		landings at least 60 inches long at the top and bottom, handrails, and at least 36 inches clear
		width.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<text class="dg-label" x="12" y="20" dominant-baseline="central">
		width <tspan class="dg-label-accent">≥ 36 in</tspan> clear between rails
	</text>

	<rect class="dg-fill" x="0" y="172" width="320" height="28" />
	<path class="dg-fill" d="M84 172 L212 116 H300 V172 Z" />
	<path class="dg-ink" d="M0 172 H84 L212 116 H300 V172" />

	<!-- handrail with 12 in extensions -->
	<path class="dg-ink" style:stroke-width="3.5px" d="M66 142 H84 L212 86 H230" />
	<path class="dg-ink" d="{posts} M72 172 V142 M224 116 V86" />

	<text
		class="dg-label-accent"
		x="143"
		y="131"
		text-anchor="middle"
		dominant-baseline="central"
		transform="rotate({angle} 143 131)"
	>
		slope ≤ 1:12
	</text>

	<text class="dg-label" x="38" y="156" text-anchor="middle" dominant-baseline="central">
		landing
	</text>
	<Dim x1={4} y1={172} x2={84} y2={172} offset={14} label="≥ 60 in" />
	<text class="dg-label" x="262" y="80" text-anchor="middle" dominant-baseline="central">
		landing
	</text>
	<Dim x1={212} y1={116} x2={300} y2={116} offset={-16} label="≥ 60 in" />

	<Dim
		x1={300}
		y1={172}
		x2={300}
		y2={116}
		offset={-14}
		label="rise ≤ 30 in"
		lx={278}
		ly={134}
		anchor="end"
	/>
	<text class="dg-label" x="278" y="153" text-anchor="end" dominant-baseline="central">
		per run
	</text>
</svg>
