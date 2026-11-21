<script lang="ts">
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
	<title id={tid}>Survey item</title>
	<desc id={did}>Measure or observe the item as described in the question.</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- clipboard -->
	<rect class="dg-ink dg-fill" x="96" y="36" width="84" height="120" rx="8" />
	<rect class="dg-ink dg-fill-2" x="118" y="28" width="40" height="18" rx="4" />
	<path class="dg-muted" d="M112 70 H164 M112 88 H164 M112 106 H150 M112 124 H158" />
	<!-- tape measure / ruler laid across it -->
	<g transform="rotate(-24 196 122)">
		<rect class="dg-ink dg-fill-2" x="142" y="108" width="112" height="26" rx="3" />
		<path
			class="dg-ink"
			style:stroke-width="1.5px"
			d="M154 108 V120 M166 108 V115 M178 108 V120 M190 108 V115 M202 108 V120 M214 108 V115 M226 108 V120 M238 108 V115"
		/>
	</g>
</svg>
