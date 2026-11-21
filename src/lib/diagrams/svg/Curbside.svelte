<script lang="ts">
	import CarTop from './CarTop.svelte';
	import Hatch from './Hatch.svelte';
	import Person from './Person.svelte';

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
	<title id={tid}>Curbside voting</title>
	<desc id={did}>
		Check there is a signed curbside voting spot near the entrance, with a way to call a poll worker
		who brings the ballot out to the car.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- building, sidewalk, street -->
	<rect class="dg-fill-2" x="0" y="0" width="64" height="200" />
	<Hatch x={0} y={0} w={64} h={200} gap={12} />
	<rect class="dg-fill" x="64" y="0" width="136" height="200" />
	<rect class="dg-fill-2" x="200" y="0" width="120" height="200" />
	<path class="dg-ink" d="M64 0 V128 M64 160 V200" />
	<path class="dg-muted dg-dash" d="M64 160 A32 32 0 0 0 96 128" />
	<path class="dg-ink" d="M64 128 L94 128" />
	<path class="dg-ink" style:stroke-width="3px" d="M200 0 V200" />
	<CarTop cx={252} cy={112} w={60} l={130} />

	<!-- route the poll worker walks -->
	<path class="dg-brand dg-dash" style:stroke-width="2.5px" d="M70 146 C120 150 170 140 214 116" />
	<polygon class="dg-brand-fill" points="220,112 206,113 213,124" />
	<Person x={120} y={186} scale={1.05} />

	<!-- sign, shown face-on -->
	<rect class="dg-ink-fill" x="155" y="80" width="5" height="26" />
	<rect class="dg-brand-fill" x="118" y="12" width="78" height="70" rx="4" />
	<text class="dg-label-on-brand" x="157" y="27" text-anchor="middle" dominant-baseline="central">
		Curbside
	</text>
	<text class="dg-label-on-brand" x="157" y="43" text-anchor="middle" dominant-baseline="central">
		voting
	</text>
	<circle class="dg-fill-bg" cx="140" cy="65" r="9" />
	<path
		class="dg-brand-fill"
		d="M135.5 60.5 q2 -1.5 3 0 l1.5 2.5 q0.5 1 -0.5 2 l-0.8 0.8 q1 2.2 3.2 3.4 l0.8 -0.8 q1 -1 2 -0.4 l2.4 1.4 q1.4 1 0 3 q-2 2 -5 0.6 q-5 -2.4 -7.4 -7.2 q-1.4 -3.2 0.8 -5.3 Z"
	/>
	<text class="dg-label-on-brand" x="154" y="65" dominant-baseline="central">call</text>
</svg>
