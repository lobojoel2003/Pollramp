<!--
	Renders the measurement diagram for a checklist item's `diagram` id, or a neutral
	clipboard graphic when there is none.
-->
<script lang="ts">
	import './diagrams.css';
	import { diagrams } from './index';
	import Fallback from './svg/Fallback.svelte';

	interface Props {
		id: string | undefined;
		class?: string;
	}

	let { id, class: className = '' }: Props = $props();

	const entry = $derived(
		id !== undefined && Object.hasOwn(diagrams, id) ? diagrams[id] : undefined
	);
</script>

<figure class="diagram {className}">
	{#if entry}
		<entry.component />
	{:else}
		<Fallback />
	{/if}
</figure>
