<script lang="ts">
	import { app } from '../../client/store.svelte.ts';

	interface Props {
		surveyId: string;
		itemId: string;
		photos: string[];
		onchange: (photos: string[]) => void;
		disabled?: boolean;
	}
	let { surveyId, itemId, photos, onchange, disabled = false }: Props = $props();

	let input: HTMLInputElement;
	let busy = $state(false);
	let error = $state<string | null>(null);
	let urls = $state<Record<string, string>>({});

	$effect(() => {
		for (const id of photos) if (!urls[id]) void app.photoUrl(id).then((u) => (urls[id] = u));
	});

	async function onfiles(files: FileList | null) {
		if (!files?.length) return;
		busy = true;
		error = null;
		try {
			const added: string[] = [];
			for (const file of Array.from(files).slice(0, 5))
				added.push(await app.addPhoto(surveyId, itemId, file));
			onchange([...photos, ...added]);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not add the photo.';
		} finally {
			busy = false;
			input.value = '';
		}
	}
</script>

<div class="photos stack" style="--gap: .5rem">
	<div class="strip">
		{#each photos as id, i (id)}
			<figure class="thumb">
				{#if urls[id]}<img src={urls[id]} alt={`Photo ${i + 1}`} />{/if}
				<button
					type="button"
					class="remove"
					aria-label={`Remove photo ${i + 1}`}
					onclick={() => onchange(photos.filter((p) => p !== id))}
				>
					✕
				</button>
			</figure>
		{/each}
		<button type="button" class="add" onclick={() => input.click()} disabled={busy || disabled}>
			<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linejoin="round"
				/>
			</svg>
			<span>{busy ? 'Saving…' : photos.length ? 'Add another' : 'Add photo'}</span>
		</button>
	</div>
	<input
		bind:this={input}
		class="visually-hidden"
		type="file"
		accept="image/*"
		capture="environment"
		multiple
		tabindex="-1"
		aria-hidden="true"
		onchange={(e) => onfiles(e.currentTarget.files)}
	/>
	{#if error}<p class="form-error" role="alert">{error}</p>{/if}
</div>

<style>
	.strip {
		display: flex;
		gap: 0.6rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}
	.thumb {
		position: relative;
		margin: 0;
		flex: none;
		width: 96px;
		height: 96px;
		border-radius: 12px;
		overflow: hidden;
		background: var(--surface-2);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.remove {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 0;
		background: rgb(0 0 0 / 65%);
		color: #fff;
		font-weight: 700;
		cursor: pointer;
	}
	.add {
		flex: none;
		width: 96px;
		height: 96px;
		border-radius: 12px;
		border: 2px dashed var(--line-strong);
		background: var(--surface);
		color: var(--ink-2);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		cursor: pointer;
	}
	.add:hover {
		border-color: var(--brand);
		color: var(--brand);
	}
</style>
