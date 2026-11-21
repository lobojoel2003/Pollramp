<script lang="ts">
	import Dim from './Dim.svelte';

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
	<title id={tid}>Elevator</title>
	<desc id={did}>
		Check the elevator works and has reachable call buttons and a floor indicator, and measure the
		door opening when fully open; it must be at least 36 inches clear.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="0" width="320" height="166" />
	<path class="dg-ink" d="M0 166 H320" />

	<!-- frame and open car -->
	<rect class="dg-ink dg-fill-2" x="64" y="36" width="152" height="130" />
	<rect class="dg-ink dg-fill-bg" x="76" y="48" width="128" height="118" />
	<rect class="dg-muted" x="98" y="62" width="84" height="88" />
	<path
		class="dg-muted"
		d="M76 48 L98 62 M204 48 L182 62 M76 166 L98 150 M204 166 L182 150 M102 110 H178"
	/>
	<rect class="dg-ink dg-fill-2" x="76" y="48" width="8" height="118" />
	<rect class="dg-ink dg-fill-2" x="196" y="48" width="8" height="118" />

	<!-- floor indicator -->
	<rect class="dg-ink dg-fill-bg" x="118" y="12" width="44" height="18" rx="3" />
	<polygon class="dg-accent-fill" points="130,26 135,16 140,26" />
	<text class="dg-label" x="150" y="21.5" dominant-baseline="central">2</text>

	<!-- call buttons -->
	<rect class="dg-ink dg-fill-bg" x="234" y="90" width="24" height="46" rx="4" />
	<circle class="dg-ink" cx="246" cy="103" r="7" />
	<circle class="dg-ink" cx="246" cy="123" r="7" />
	<polygon class="dg-ink-fill" points="246,99 242,106 250,106" />
	<polygon class="dg-ink-fill" points="246,127 242,120 250,120" />
	<text class="dg-label-sm" x="246" y="152" text-anchor="middle" dominant-baseline="central">
		call
	</text>

	<Dim x1={84} y1={166} x2={196} y2={166} offset={18} label="≥ 36 in" />
</svg>
