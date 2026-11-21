<script lang="ts">
	import Dim from './Dim.svelte';
	import Hatch from './Hatch.svelte';
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
	<title id={tid}>Access aisle markings</title>
	<desc id={did}>
		Check the access aisle has a blue border, blue hatching and the words NO PARKING painted in it,
		with letters at least 12 inches high.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="10" y="10" width="300" height="180" rx="8" />
	<path class="dg-ink" d="M16 22 H106" />
	<rect class="dg-ink-fill" x="16" y="22" width="5" height="168" />
	<Isa x={44} y={60} size={36} />

	<Hatch x={108} y={24} w={86} h={104} gap={12} class="dg-brand-thin" />
	<rect class="dg-brand" style:stroke-width="3.5px" x="106" y="22" width="90" height="168" />
	<text class="dg-paint" x="151" y="148" text-anchor="middle">NO</text>
	<text class="dg-paint" x="151" y="176" text-anchor="middle">PARKING</text>

	<text class="dg-label" x="210" y="50" dominant-baseline="central">blue border</text>
	<text class="dg-label" x="210" y="67" dominant-baseline="central">and hatching</text>
	<path class="dg-muted" d="M206 50 H200" />

	<Dim x1={204} y1={176} x2={204} y2={163.5} label="≥ 12 in" lx={216} ly={160} anchor="start" />
	<text class="dg-label" x="216" y="141" dominant-baseline="central">letter height</text>
</svg>
