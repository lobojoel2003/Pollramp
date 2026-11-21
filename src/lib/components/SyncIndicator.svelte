<script lang="ts">
	import { app } from '../client/store.svelte.ts';

	const state = $derived(
		app.syncing
			? 'syncing'
			: !app.online || app.serverReachable === false
				? 'offline'
				: app.syncError
					? 'error'
					: app.pending > 0
						? 'pending'
						: 'synced'
	);

	const label = $derived(
		{
			syncing: 'Syncing…',
			offline: app.pending ? `Offline · ${app.pending} to sync` : 'Offline',
			error: 'Sync problem',
			pending: `${app.pending} to sync`,
			synced: 'All synced'
		}[state]
	);

	const lastSync = $derived(
		app.lastSync
			? new Date(app.lastSync).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
			: 'never'
	);
</script>

<button
	type="button"
	class="sync sync-{state}"
	onclick={() => app.sync()}
	title={app.syncError ?? `Last synced ${lastSync}. Click to sync now.`}
	aria-live="polite"
>
	<span class="dot" aria-hidden="true"></span>
	<span>{label}</span>
</button>

<style>
	.sync {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 40px;
		padding: 0.3rem 0.8rem;
		border-radius: 999px;
		border: 1.5px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
	}
	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--pass);
	}
	.sync-pending .dot {
		background: var(--fix);
	}
	.sync-offline .dot {
		background: var(--none);
	}
	.sync-error .dot {
		background: var(--fail);
	}
	.sync-syncing .dot {
		background: var(--progress);
		animation: pulse 1s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
</style>
