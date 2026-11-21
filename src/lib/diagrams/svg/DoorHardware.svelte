<script lang="ts">
	import Dim from './Dim.svelte';
	import Mark from './Mark.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const doors = [
		{ x: 84, name: 'lever', ok: true },
		{ x: 162, name: 'push bar', ok: true },
		{ x: 240, name: 'knob', ok: false }
	];
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Door hardware</title>
	<desc id={did}>
		Check the door handle can be used with one closed fist, without grasping or twisting (levers and
		push bars pass, round knobs fail), and is 34 to 48 inches above the floor.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="176" width="320" height="24" />
	{#each doors as d (d.x)}
		<rect class="dg-ink dg-fill" x={d.x} y="14" width="64" height="162" />
		<Mark x={d.x + 32} y={124} ok={d.ok} />
	{/each}
	<path class="dg-ink" d="M0 176 H320" />

	<!-- 34–48 in band -->
	<rect class="dg-wash" x="78" y="61" width="234" height="33" />
	<path class="dg-accent-thin dg-dash" d="M74 61 H312 M74 94 H312" />

	<!-- lever, push bar, knob -->
	<path class="dg-ink" style:stroke-width="5px" d="M138 78 L112 80" />
	<circle class="dg-ink-fill" cx="138" cy="78" r="5.5" />
	<path class="dg-ink" style:stroke-width="6px" d="M170 78 H218" />
	<path class="dg-ink" style:stroke-width="3px" d="M172 78 V70 M216 78 V70" />
	<circle class="dg-ink-fill" cx="292" cy="78" r="7.5" />

	{#each doors as d (d.x)}
		<text class="dg-label-sm" x={d.x + 32} y="152" text-anchor="middle" dominant-baseline="central">
			{d.name}
		</text>
	{/each}

	<Dim x1={40} y1={94} x2={40} y2={61} label="34–48 in" />
	<text class="dg-label-sm" x="40" y="112" text-anchor="middle" dominant-baseline="central">
		above
	</text>
	<text class="dg-label-sm" x="40" y="127" text-anchor="middle" dominant-baseline="central">
		floor
	</text>
</svg>
