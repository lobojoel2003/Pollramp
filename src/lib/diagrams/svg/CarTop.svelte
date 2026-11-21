<svelte:options namespace="svg" />

<!-- Top view of a car or van centred on (cx, cy), nose toward -y before `rotate`. Sizes in px. -->
<script lang="ts">
	interface Props {
		cx: number;
		cy: number;
		w: number;
		l: number;
		rotate?: number;
		van?: boolean;
	}

	let { cx, cy, w, l, rotate = 0, van = false }: Props = $props();

	const s = $derived.by(() => {
		const hw = w / 2;
		const hl = l / 2;
		const f = (n: number) => Math.round(n * 100) / 100;
		const glass = van
			? { y0: -hl * 0.8, y1: -hl * 0.56, top: hw * 0.74, bot: hw * 0.84, rear: hl * 0.9 }
			: { y0: -hl * 0.42, y1: -hl * 0.12, top: hw * 0.66, bot: hw * 0.8, rear: hl * 0.62 };
		return {
			hw: f(hw),
			hl: f(hl),
			rx: f(van ? w * 0.16 : w * 0.3),
			wheelL: f(l * 0.17),
			wheelY: [f(-hl * 0.62 - l * 0.085), f(hl * 0.55 - l * 0.085)],
			windshield: `M${f(-glass.top)},${f(glass.y0)} L${f(glass.top)},${f(glass.y0)} L${f(glass.bot)},${f(glass.y1)} L${f(-glass.bot)},${f(glass.y1)} Z`,
			roof: {
				x: f(-hw * 0.78),
				y: f(glass.y1),
				w: f(hw * 1.56),
				h: f(glass.rear - glass.y1 - (van ? hl * 0.06 : hl * 0.12))
			},
			rearGlass: `M${f(-hw * 0.7)},${f(glass.rear - (van ? hl * 0.06 : hl * 0.12))} L${f(hw * 0.7)},${f(glass.rear - (van ? hl * 0.06 : hl * 0.12))} L${f(hw * 0.6)},${f(glass.rear)} L${f(-hw * 0.6)},${f(glass.rear)} Z`
		};
	});
</script>

<g transform="translate({cx} {cy}) rotate({rotate})">
	<g class="dg-ink-fill">
		{#each s.wheelY as wy (wy)}
			<rect x={-s.hw - 2.5} y={wy} width="5" height={s.wheelL} rx="1.5" />
			<rect x={s.hw - 2.5} y={wy} width="5" height={s.wheelL} rx="1.5" />
		{/each}
	</g>
	<rect class="dg-ink dg-fill-2" x={-s.hw} y={-s.hl} width={w} height={l} rx={s.rx} />
	<path class="dg-muted-fill" d={s.windshield} />
	<rect class="dg-muted" x={s.roof.x} y={s.roof.y} width={s.roof.w} height={s.roof.h} rx="3" />
	<path class="dg-muted-fill" d={s.rearGlass} />
</g>
