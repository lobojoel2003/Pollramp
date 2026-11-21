<script lang="ts">
	import Isa from './Isa.svelte';

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
	<title id={tid}>Doorbell for assistance</title>
	<desc id={did}>
		Check there is a working doorbell or call button beside the entrance, with a sign telling voters
		to ring for assistance.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="0" width="320" height="180" />
	<path class="dg-ink" d="M0 180 H320" />

	<!-- door -->
	<rect class="dg-ink dg-fill-2" x="44" y="30" width="100" height="150" />
	<rect class="dg-ink dg-fill-bg" x="52" y="38" width="84" height="142" />
	<rect class="dg-muted" x="66" y="52" width="56" height="44" rx="2" />
	<path class="dg-ink" style:stroke-width="4px" d="M126 112 H110" />
	<circle class="dg-ink-fill" cx="126" cy="112" r="3.5" />

	<!-- sign -->
	<rect class="dg-brand-fill" x="160" y="36" width="140" height="46" rx="4" />
	<Isa x={166} y={44} size={30} knockout />
	<text class="dg-label-on-brand" style:font-size="13px" x="204" y="51" dominant-baseline="central">
		Ring for
	</text>
	<text class="dg-label-on-brand" style:font-size="13px" x="204" y="68" dominant-baseline="central">
		assistance
	</text>

	<!-- wireless push button and chime -->
	<rect class="dg-ink dg-fill-bg" x="166" y="100" width="20" height="28" rx="4" />
	<circle class="dg-brand-fill" cx="176" cy="114" r="6" />
	<path
		class="dg-accent"
		d="M194 106 A11 11 0 0 1 194 122 M201 100 A19 19 0 0 1 201 128 M208 94 A27 27 0 0 1 208 134"
	/>
	<text class="dg-label" x="176" y="150" text-anchor="middle" dominant-baseline="central">
		doorbell
	</text>
</svg>
