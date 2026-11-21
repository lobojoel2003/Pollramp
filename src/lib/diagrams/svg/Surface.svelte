<script lang="ts">
	import Mark from './Mark.svelte';

	const uid = $props.id();
	const tid = `${uid}-title`;
	const did = `${uid}-desc`;

	const W = 67;
	const H = 86;
	const Y = 14;
	const tiles = [
		{ x: 14, name: 'concrete', ok: true },
		{ x: 89, name: 'pavers', ok: true },
		{ x: 164, name: 'gravel', ok: false },
		{ x: 239, name: 'grass', ok: false }
	];

	// Small deterministic pseudo-random sequence so the texture is stable between renders.
	function rand(seed: number) {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}

	const r1 = rand(7);
	const speckles = Array.from({ length: 26 }, () => [
		14 + 5 + r1() * (W - 10),
		Y + 5 + r1() * (H - 10)
	]);

	function brickJoints() {
		let d = '';
		for (let row = 0; row < 6; row++) {
			const y = Y + row * (H / 6);
			if (row > 0) d += `M89 ${y}H${89 + W}`;
			for (let x = 89 + (row % 2 ? 11 : 22); x < 89 + W - 2; x += 22)
				d += `M${x} ${y}V${y + H / 6}`;
		}
		return d;
	}
	const bricks = brickJoints();

	const r2 = rand(11);
	const stones: { cx: number; cy: number; rx: number; ry: number }[] = [];
	for (let gy = 0; gy < 7; gy++)
		for (let gx = 0; gx < 5; gx++) {
			const rx = 3.4 + r2() * 2.4;
			stones.push({
				cx: 164 + 7.5 + gx * 13 + (r2() - 0.5) * 4 + (gy % 2 ? 3 : -1),
				cy: Y + 7 + gy * 12 + (r2() - 0.5) * 3,
				rx,
				ry: rx * (0.7 + r2() * 0.25)
			});
		}

	function grassBlades() {
		const r3 = rand(5);
		let d = '';
		for (let gy = 0; gy < 7; gy++)
			for (let gx = 0; gx < 6; gx++) {
				const x = (239 + 7 + gx * 11 + (gy % 2 ? 5 : 0) + (r3() - 0.5) * 3).toFixed(1);
				const y = (Y + 13 + gy * 11.5).toFixed(1);
				if (Number(x) > 239 + W - 6) continue;
				d += `M${x} ${y}l-3 -8M${x} ${y}l0 -9M${x} ${y}l3 -8`;
			}
		return d;
	}
	const blades = grassBlades();
</script>

<svg
	viewBox="0 0 320 200"
	role="img"
	aria-labelledby="{tid} {did}"
	xmlns="http://www.w3.org/2000/svg"
>
	<title id={tid}>Ground surface</title>
	<desc id={did}>
		Check the route surface is firm, stable and slip resistant: concrete and pavers pass, loose
		gravel and grass fail.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<!-- concrete -->
	<rect class="dg-fill-2" x="14" y={Y} width={W} height={H} />
	<path class="dg-muted" d="M14 {Y + H / 2}H{14 + W}" />
	{#each speckles as [cx, cy], i (i)}
		<circle class="dg-muted-fill" {cx} {cy} r="1" />
	{/each}

	<!-- pavers -->
	<rect class="dg-fill-2" x="89" y={Y} width={W} height={H} />
	<path class="dg-ink" style:stroke-width="1.5px" d={bricks} />

	<!-- gravel -->
	<rect class="dg-fill" x="164" y={Y} width={W} height={H} />
	{#each stones as s, i (i)}
		<ellipse class="dg-muted dg-fill-2" cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} />
	{/each}
	<!-- trim stones that spill past the tile edge -->
	<path
		class="dg-fill-bg"
		d="M158 {Y - 8}H237V{Y}H158Z M158 {Y + H}H237V{Y + H + 8}H158Z M156 {Y}H164V{Y +
			H}H156Z M231 {Y}H239V{Y + H}H231Z"
	/>

	<!-- grass -->
	<rect class="dg-fill" x="239" y={Y} width={W} height={H} />
	<path class="dg-brand-thin" d={blades} />

	{#each tiles as t (t.name)}
		<rect class="dg-ink" x={t.x} y={Y} width={W} height={H} />
		<text class="dg-label" x={t.x + W / 2} y="116" text-anchor="middle" dominant-baseline="central">
			{t.name}
		</text>
		<Mark x={t.x + W / 2} y={142} ok={t.ok} r={12} />
	{/each}

	<text class="dg-label" x="160" y="178" text-anchor="middle" dominant-baseline="central">
		Pass: firm, stable, slip resistant
	</text>
</svg>
