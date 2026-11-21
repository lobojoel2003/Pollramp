<script lang="ts">
	import Isa from './Isa.svelte';

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
	<title id={tid}>Accessible space markings</title>
	<desc id={did}>
		Check the accessible space is outlined in blue paint with the wheelchair symbol painted inside,
		and has a sign at its head reading PARKING BY DISABLED PERMIT ONLY.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="180" rx="8" />
	<rect class="dg-fill-2" x="10" y="10" width="300" height="24" />
	<path class="dg-ink" d="M10 34 H310" />
	<rect class="dg-brand" style:stroke-width="4px" x="36" y="42" width="130" height="140" />
	<Isa x={75} y={86} size={52} />
	<text class="dg-label-brand" x="101" y="164" text-anchor="middle" dominant-baseline="central">
		blue outline
	</text>

	<!-- sign at the head of the space, shown face-on -->
	<circle class="dg-ink-fill" cx="101" cy="22" r="4" />
	<path class="dg-muted dg-dash" d="M107 22 H198" />
	<rect class="dg-ink dg-fill-bg" x="198" y="18" width="104" height="112" rx="4" />
	<Isa x={234} y={26} size={32} />
	<text class="dg-label-sm" x="250" y="76" text-anchor="middle" dominant-baseline="central">
		PARKING BY
	</text>
	<text class="dg-label-sm" x="250" y="94" text-anchor="middle" dominant-baseline="central">
		DISABLED
	</text>
	<text class="dg-label-sm" x="250" y="112" text-anchor="middle" dominant-baseline="central">
		PERMIT ONLY
	</text>
	<rect class="dg-ink-fill" x="247" y="131" width="6" height="40" />
</svg>
