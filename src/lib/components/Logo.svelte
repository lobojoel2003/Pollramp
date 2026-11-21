<script lang="ts">
	interface Props {
		size?: number;
		title?: string;
	}
	let { size = 36, title }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 64 64"
	role={title ? 'img' : undefined}
	aria-hidden={title ? undefined : 'true'}
	aria-label={title}
	xmlns="http://www.w3.org/2000/svg"
>
	<rect width="64" height="64" rx="16" fill="#0b5e55" />
	<path d="M10 48 L54 48 L54 28 Z" fill="#ffffff" />
	<path d="M10 48 L54 48" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
	<path
		d="M13 25 L21 33 L37 15"
		fill="none"
		stroke="#f2a541"
		stroke-width="6"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
