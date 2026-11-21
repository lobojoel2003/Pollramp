<svelte:options namespace="svg" />

<!--
	Dimension line between (x1,y1) and (x2,y2) with an arrowhead at each end, end ticks and a
	centred accent label.

	`offset` moves the dimension line sideways, clockwise of the x1→x2 direction (below a
	left-to-right line, right of a bottom-to-top line); extension lines then run back to the
	measured points. Very short dimensions get their arrows outside, pointing in.
	`lx`/`ly`/`anchor` place the label somewhere other than the middle of the line.
-->
<script lang="ts">
	import { textWidth } from './text';

	interface Props {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		label: string;
		offset?: number;
		lx?: number;
		ly?: number;
		anchor?: 'start' | 'middle' | 'end';
	}

	let { x1, y1, x2, y2, label, offset = 0, lx, ly, anchor = 'middle' }: Props = $props();

	const ARROW = 7;
	const HALF = 3.3;
	const TICK = 5;
	const GAP = 2;

	const f = (n: number) => Math.round(n * 100) / 100;
	const pt = (x: number, y: number) => `${f(x)},${f(y)}`;

	const g = $derived.by(() => {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const len = Math.hypot(dx, dy) || 1;
		const ux = dx / len;
		const uy = dy / len;
		const nx = -uy;
		const ny = ux;
		const ax = x1 + nx * offset;
		const ay = y1 + ny * offset;
		const bx = x2 + nx * offset;
		const by = y2 + ny * offset;
		const inside = len >= ARROW * 2 + 6;
		const dir = inside ? 1 : -1;

		const head = (tx: number, ty: number, sx: number, sy: number) => {
			// Tip at (tx,ty); the base sits ARROW units along (sx,sy).
			const cx = tx + sx * ARROW;
			const cy = ty + sy * ARROW;
			return [
				pt(tx, ty),
				pt(cx + nx * HALF, cy + ny * HALF),
				pt(cx - nx * HALF, cy - ny * HALF)
			].join(' ');
		};

		const line = inside
			? `M${pt(ax + ux * (ARROW - 1), ay + uy * (ARROW - 1))}L${pt(bx - ux * (ARROW - 1), by - uy * (ARROW - 1))}`
			: `M${pt(ax - ux * (ARROW + 7), ay - uy * (ARROW + 7))}L${pt(bx + ux * (ARROW + 7), by + uy * (ARROW + 7))}`;

		let ext = '';
		if (Math.abs(offset) > GAP) {
			const s = Math.sign(offset);
			for (const [px, py, qx, qy] of [
				[x1, y1, ax, ay],
				[x2, y2, bx, by]
			]) {
				ext += `M${pt(px + nx * s * GAP, py + ny * s * GAP)}L${pt(qx + nx * s * 4, qy + ny * s * 4)}`;
			}
		}
		const ticks =
			`M${pt(ax - nx * TICK, ay - ny * TICK)}L${pt(ax + nx * TICK, ay + ny * TICK)}` +
			`M${pt(bx - nx * TICK, by - ny * TICK)}L${pt(bx + nx * TICK, by + ny * TICK)}`;

		return {
			line,
			ext: ext + ticks,
			a: head(ax, ay, ux * dir, uy * dir),
			b: head(bx, by, -ux * dir, -uy * dir),
			mx: (ax + bx) / 2,
			my: (ay + by) / 2,
			boxW: textWidth(label) + 8
		};
	});
</script>

<g class="dg-dim">
	<path class="dg-accent-thin" d={g.ext} />
	<path class="dg-accent" d={g.line} />
	<polygon class="dg-accent-fill" points={g.a} />
	<polygon class="dg-accent-fill" points={g.b} />
	{#if lx === undefined && ly === undefined}
		<!-- backing box so the line does not show through the gaps between words -->
		<rect
			class="dg-fill-bg"
			x={f(g.mx - g.boxW / 2)}
			y={f(g.my - 9)}
			width={f(g.boxW)}
			height="18"
			rx="4"
		/>
	{/if}
	<text
		class="dg-label-accent"
		x={f(lx ?? g.mx)}
		y={f(ly ?? g.my)}
		text-anchor={anchor}
		dominant-baseline="central"
	>
		{label}
	</text>
</g>
