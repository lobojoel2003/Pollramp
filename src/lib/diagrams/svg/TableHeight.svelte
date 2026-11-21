<script lang="ts">
	import Dim from './Dim.svelte';
	import Wheelchair from './Wheelchair.svelte';

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
	<title id={tid}>Table height and knee space</title>
	<desc id={did}>
		Measure the table top: 28 to 34 inches above the floor; and the space under it: at least 27
		inches high for a wheelchair user's knees.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="180" width="320" height="20" />
	<path class="dg-ink" d="M0 180 H320" />

	<!-- table: far legs drawn faintly behind the voter -->
	<rect class="dg-muted" x="134" y="106" width="6" height="74" />
	<rect class="dg-ink dg-fill-2" x="276" y="106" width="7" height="74" />
	<rect class="dg-ink dg-fill-2" x="124" y="100" width="166" height="6" />

	<Wheelchair x={99} y={180} hand={[22, -32]} />

	<Dim x1={214} y1={180} x2={214} y2={106} label="≥ 27 in" />
	<Dim x1={306} y1={180} x2={306} y2={100} label="28–34 in" lx={302} ly={86} anchor="end" />
	<path class="dg-accent-thin" d="M292 100 H302" />
</svg>
