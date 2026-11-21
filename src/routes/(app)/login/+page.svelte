<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
	import { app } from '#lib/client/store.svelte.ts';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let busy = $state(false);

	const next = $derived.by(() => {
		const n = page.url.searchParams.get('next');
		return n && n.startsWith('/') && !n.startsWith('//') ? n : '/';
	});

	onMount(() => {
		void app.start();
	});

	$effect(() => {
		if (app.ready && app.user) void goto(next, { replaceState: true });
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		busy = true;
		try {
			if (app.needsSetup) await app.setup(name, email, password);
			else await app.login(email, password);
			await goto(next, { replaceState: true });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not sign in.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{app.needsSetup ? 'Set up Pollramp' : 'Sign in'} · Pollramp</title>
</svelte:head>

<main class="login" id="main">
	<div class="panel card stack" style="--gap: 1.25rem">
		<div class="cluster">
			<Logo size={48} />
			<div>
				<h1>Pollramp</h1>
				<p class="muted small">Polling place accessibility surveys</p>
			</div>
		</div>

		{#if app.needsSetup}
			<div class="form-ok">Welcome! Create the first administrator account for your office.</div>
		{/if}

		<form class="stack" onsubmit={submit} novalidate>
			{#if app.needsSetup}
				<div class="field">
					<label for="name">Your name</label>
					<input id="name" autocomplete="name" bind:value={name} required />
				</div>
			{/if}
			<div class="field">
				<label for="email">Email</label>
				<input id="email" type="email" autocomplete="username" bind:value={email} required />
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					autocomplete={app.needsSetup ? 'new-password' : 'current-password'}
					bind:value={password}
					required
					aria-describedby={app.needsSetup ? 'pw-hint' : undefined}
				/>
				{#if app.needsSetup}<span id="pw-hint" class="hint">At least 10 characters.</span>{/if}
			</div>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			{#if app.serverReachable === false}
				<p class="form-error" role="alert">
					The server can't be reached. You need to be online the first time you sign in on this
					device.
				</p>
			{/if}
			<button class="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
				{busy ? 'Please wait…' : app.needsSetup ? 'Create account' : 'Sign in'}
			</button>
		</form>
		<p class="small muted">
			Looking for accessibility information as a voter? <a href="/p">Find your polling place</a>.
		</p>
	</div>
</main>

<style>
	.login {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background:
			radial-gradient(circle at 15% 10%, var(--brand-soft), transparent 40%),
			radial-gradient(circle at 90% 90%, var(--fix-soft), transparent 35%), var(--bg);
	}
	.panel {
		width: min(100%, 440px);
		padding: 2rem;
	}
	h1 {
		margin: 0;
		font-size: 1.6rem;
	}
	p {
		margin: 0;
	}
</style>
