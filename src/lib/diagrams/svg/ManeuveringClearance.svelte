<script lang="ts">
	import Dim from './Dim.svelte';
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
	<title id={tid}>Latch-side clearance</title>
	<desc id={did}>
		On the pull side of the door, measure the clear floor space beside the latch edge, along the
		wall; it must be at least 18 inches.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<text class="dg-label-muted" x="160" y="20" text-anchor="middle" dominant-baseline="central">
		push side
	</text>

	<!-- clear floor area on the pull side -->
	<rect class="dg-wash" x="110" y="56" width="138" height="132" />
	<rect class="dg-accent-thin dg-dash" x="110" y="56" width="138" height="132" />

	<!-- wall, jambs, door -->
	<rect class="dg-fill-2" x="0" y="36" width="106" height="20" />
	<rect class="dg-fill-2" x="204" y="36" width="116" height="20" />
	<Hatch x={0} y={36} w={106} h={20} gap={9} />
	<Hatch x={204} y={36} w={116} h={20} gap={9} />
	<path class="dg-ink" d="M0 36 H106 V56 H0 M320 36 H204 V56 H320" />
	<rect class="dg-ink dg-fill" x="108" y="42" width="94" height="8" />
	<path class="dg-muted dg-dash" d="M202 50 A92 92 0 0 1 110 142 V50" />
	<circle class="dg-ink-fill" cx="196" cy="56" r="3" />

	<text class="dg-label-sm" x="224" y="100" text-anchor="middle" dominant-baseline="central">
		latch
	</text>
	<text class="dg-label-sm" x="224" y="115" text-anchor="middle" dominant-baseline="central">
		side
	</text>
	<text class="dg-label" x="182" y="166" text-anchor="middle" dominant-baseline="central">
		pull side
	</text>

	<Dim
		x1={202}
		y1={56}
		x2={248}
		y2={56}
		offset={18}
		label="≥ 18 in"
		lx={256}
		ly={74}
		anchor="start"
	/>
</svg>
