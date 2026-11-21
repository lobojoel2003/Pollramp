<svelte:options namespace="svg" />

<!--
	45° hatching clipped to a rectangle (x, y, w, h) or to a convex polygon (`points`).
	The clipping is computed here, so no clipPath or pattern ids are needed.
-->
<script lang="ts">
	interface Props {
		x?: number;
		y?: number;
		w?: number;
		h?: number;
		points?: [number, number][];
		gap?: number;
		/** 1 = "/" lines, -1 = "\" lines. */
		dir?: 1 | -1;
		class?: string;
	}

	let {
		x = 0,
		y = 0,
		w = 0,
		h = 0,
		points,
		gap = 10,
		dir = 1,
		class: cls = 'dg-muted'
	}: Props = $props();

	const d = $derived.by(() => {
		const poly: [number, number][] = points ?? [
			[x, y],
			[x + w, y],
			[x + w, y + h],
			[x, y + h]
		];
		const f = (n: number) => Math.round(n * 100) / 100;
		// Lines run along `dv` and are spaced along the unit normal `nv`.
		const s = Math.SQRT1_2;
		const dv: [number, number] = dir === 1 ? [s, -s] : [s, s];
		const nv: [number, number] = [-dv[1], dv[0]];
		let area = 0;
		for (let i = 0; i < poly.length; i++) {
			const [ax, ay] = poly[i];
			const [bx, by] = poly[(i + 1) % poly.length];
			area += ax * by - bx * ay;
		}
		const turn = Math.sign(area) || 1;
		const proj = poly.map(([px, py]) => px * nv[0] + py * nv[1]);
		const lo = Math.min(...proj);
		const hi = Math.max(...proj);

		let out = '';
		for (let c = lo + gap / 2; c < hi; c += gap) {
			const p0x = c * nv[0];
			const p0y = c * nv[1];
			let t0 = -Infinity;
			let t1 = Infinity;
			for (let i = 0; i < poly.length && t0 < t1; i++) {
				const [ax, ay] = poly[i];
				const [bx, by] = poly[(i + 1) % poly.length];
				// Inward normal of edge a→b.
				const mx = -(by - ay) * turn;
				const my = (bx - ax) * turn;
				const num = mx * (p0x - ax) + my * (p0y - ay);
				const den = mx * dv[0] + my * dv[1];
				if (Math.abs(den) < 1e-9) {
					if (num < 0) t1 = -Infinity;
				} else if (den > 0) t0 = Math.max(t0, -num / den);
				else t1 = Math.min(t1, -num / den);
			}
			if (t1 - t0 > 0.5) {
				out += `M${f(p0x + dv[0] * t0)} ${f(p0y + dv[1] * t0)}L${f(p0x + dv[0] * t1)} ${f(p0y + dv[1] * t1)}`;
			}
		}
		return out;
	});
</script>

<path class={cls} {d} />
