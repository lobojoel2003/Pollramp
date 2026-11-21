<script lang="ts">
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
	<title id={tid}>Lighting</title>
	<desc id={did}>
		Check the voting booths and ballot area are well lit so voters can read the ballot; bring a work
		light if they are not.
	</desc>
	<rect class="dg-bg" width="320" height="200" />

	<rect class="dg-fill" x="0" y="184" width="320" height="16" />
	<path class="dg-ink" d="M0 184 H320" />

	<!-- tabletop booth: privacy panels, shelf, legs -->
	<path class="dg-ink" d="M72 134 L64 184 M248 134 L256 184 M100 134 L98 184 M220 134 L222 184" />
	<path class="dg-ink dg-fill" d="M90 50 L62 62 V118 L90 112 Z M230 50 L258 62 V118 L230 112 Z" />
	<rect class="dg-ink dg-fill-2" x="90" y="50" width="140" height="62" />
	<path class="dg-ink dg-fill-bg" d="M90 112 H230 L258 128 H62 Z" />
	<rect class="dg-ink dg-fill-2" x="62" y="128" width="196" height="6" />

	<!-- ballot on the shelf -->
	<path class="dg-ink dg-fill-bg" style:stroke-width="1.5px" d="M134 114 H186 L192 126 H128 Z" />
	<path class="dg-muted" d="M140 118 H160 M140 122 H170" />
	<circle class="dg-muted" cx="176" cy="118" r="1.8" />
	<text class="dg-label-sm" x="160" y="152" text-anchor="middle" dominant-baseline="central">
		ballot
	</text>

	<!-- clamp-on work light and its light -->
	<path
		class="dg-accent-thin dg-dash"
		d="M160 40 L130 112 M160 40 L150 112 M160 40 L172 112 M160 40 L192 112"
	/>
	<path class="dg-ink" style:stroke-width="3px" d="M204 50 V26 H180" />
	<path class="dg-ink dg-fill-2" d="M150 22 H178 L184 36 H144 Z" />
	<circle class="dg-accent-fill" cx="164" cy="39" r="4" />
	<text class="dg-label" x="214" y="28" dominant-baseline="central">work light</text>
</svg>
