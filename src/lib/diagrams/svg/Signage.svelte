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
	<title id={tid}>Directional signs</title>
	<desc id={did}>
		If the main entrance is not accessible, check there are signs with the wheelchair symbol
		pointing to the accessible entrance.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="176" width="320" height="24" />
	<!-- main building with stepped entrance -->
	<rect class="dg-ink dg-fill-2" x="12" y="26" width="220" height="150" />
	<rect class="dg-ink dg-fill-bg" x="40" y="96" width="44" height="60" />
	<path class="dg-ink" d="M62 96 V156" />
	<rect class="dg-ink dg-fill" x="30" y="156" width="64" height="10" />
	<rect class="dg-ink dg-fill" x="22" y="166" width="80" height="10" />

	<!-- side wing with the accessible entrance -->
	<rect class="dg-ink dg-fill" x="232" y="64" width="76" height="112" />
	<rect class="dg-ink dg-fill-bg" x="256" y="114" width="32" height="62" />
	<Isa x={262} y={88} size={20} />

	<!-- directional sign -->
	<rect class="dg-brand-fill" x="108" y="56" width="116" height="44" rx="4" />
	<Isa x={112} y={63} size={30} knockout />
	<text class="dg-label-on-brand" x="146" y="70" dominant-baseline="central">Accessible</text>
	<text class="dg-label-on-brand" x="146" y="86" dominant-baseline="central">entrance →</text>

	<path class="dg-ink" style:stroke-width="3px" d="M0 176 H320" />
	<path class="dg-brand dg-dash" style:stroke-width="2.5px" d="M104 188 H262" />
	<polygon class="dg-brand-fill" points="274,188 262,182 262,194" />
</svg>
