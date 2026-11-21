<script lang="ts">
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
	<title id={tid}>Door opening force</title>
	<desc id={did}>
		Hook a push-pull force gauge on the door at the latch edge and pull at a right angle to the
		door; it must open with no more than 5 pounds of force (lbf).
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- wall and closed door, in plan -->
	<rect class="dg-fill-2" x="0" y="54" width="72" height="22" />
	<rect class="dg-fill-2" x="248" y="54" width="72" height="22" />
	<Hatch x={0} y={54} w={72} h={22} gap={9} />
	<Hatch x={248} y={54} w={72} h={22} gap={9} />
	<path class="dg-ink" d="M0 54 H72 V76 H0 M320 54 H248 V76 H320" />
	<rect class="dg-ink dg-fill" x="76" y="61" width="168" height="9" />
	<circle class="dg-ink-fill" cx="80" cy="65.5" r="3" />
	<text class="dg-label-muted" x="96" y="88" dominant-baseline="central">hinge</text>
	<text class="dg-label-muted" x="160" y="40" text-anchor="middle" dominant-baseline="central">
		door (closed)
	</text>

	<!-- force gauge hooked at the latch edge, held by a hand -->
	<path class="dg-ink" d="M232 70 V92" />
	<path class="dg-muted" d="M224 70 V78 H232" />
	<rect class="dg-ink dg-fill-2" x="220" y="92" width="24" height="52" rx="4" />
	<circle class="dg-ink dg-fill-bg" cx="232" cy="110" r="9" />
	<path class="dg-accent" style:stroke-width="2px" d="M232 110 L237 104" />
	<path class="dg-figure" style:stroke-width="15px" d="M232 152 L236 200" />
	<rect class="dg-ink-fill" x="216" y="134" width="32" height="22" rx="9" />
	<path
		class="dg-mark-glyph"
		style:stroke-width="1.5px"
		d="M224 136 V146 M232 136 V146 M240 136 V146"
	/>

	<!-- pull direction -->
	<path class="dg-accent" d="M266 96 V146" />
	<polygon class="dg-accent-fill" points="266,158 259,144 273,144" />
	<text class="dg-label-accent" x="208" y="124" text-anchor="end" dominant-baseline="central">
		≤ 5 lbf
	</text>

	<text class="dg-label" x="104" y="166" text-anchor="middle" dominant-baseline="central">
		hook at the latch edge,
	</text>
	<text class="dg-label" x="104" y="184" text-anchor="middle" dominant-baseline="central">
		pull at a right angle
	</text>
</svg>
