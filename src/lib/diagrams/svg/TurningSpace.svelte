<script lang="ts">
	import Dim from './Dim.svelte';
	import WheelchairTop from './WheelchairTop.svelte';

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
	<title id={tid}>Turning space</title>
	<desc id={did}>
		Check for a clear circle 60 inches across, free of furniture and obstacles, where a wheelchair
		user can turn around.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<circle class="dg-wash" cx="160" cy="92" r="78" />
	<circle class="dg-accent-thin dg-dash" cx="160" cy="92" r="78" />
	<path class="dg-muted" style:stroke-width="2px" d="M108 52 A64 64 0 0 1 196 39" />
	<polygon class="dg-muted-fill" points="205,44 191,44 198,33" />
	<WheelchairTop cx={160} cy={96} scale={2} rotate={-30} />

	<Dim x1={82} y1={92} x2={238} y2={92} offset={92} label="60 in" />
</svg>
