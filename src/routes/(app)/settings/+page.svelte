<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '#lib/client/api.ts';
	import { app } from '#lib/client/store.svelte.ts';
	import { bases, overlays } from '#lib/checklist/registry.ts';
	import type { Role } from '#lib/model.ts';

	interface ListedUser {
		id: string;
		email: string;
		name: string;
		role: Role;
		createdAt: string;
		disabled: boolean;
	}

	let users = $state<ListedUser[] | null>(null);
	let usersError = $state<string | null>(null);
	let newUser = $state<{ name: string; email: string; role: Role; password: string }>({
		name: '',
		email: '',
		role: 'surveyor',
		password: ''
	});
	let userMessage = $state<string | null>(null);
	type Theme = 'system' | 'light' | 'dark';
	const saved = localStorage.getItem('pollramp-theme');
	let theme = $state<Theme>(saved === 'light' || saved === 'dark' ? saved : 'system');

	function setTheme(value: Theme) {
		theme = value;
		localStorage.setItem('pollramp-theme', value);
		if (value === 'system') document.documentElement.removeAttribute('data-theme');
		else document.documentElement.dataset.theme = value;
	}

	async function loadUsers() {
		try {
			users = (await api<{ users: ListedUser[] }>('/api/users')).users;
		} catch (e) {
			usersError = e instanceof Error ? e.message : 'Could not load users.';
		}
	}

	$effect(() => {
		if (app.user?.role === 'admin' && users === null) void loadUsers();
	});

	async function addUser(event: SubmitEvent) {
		event.preventDefault();
		userMessage = null;
		usersError = null;
		try {
			await api('/api/users', { method: 'POST', json: newUser });
			userMessage = `Added ${newUser.name}. Share the password with them securely.`;
			newUser = { name: '', email: '', role: 'surveyor', password: '' };
			await loadUsers();
		} catch (e) {
			usersError = e instanceof Error ? e.message : 'Could not add the user.';
		}
	}

	let confirmLogout = $state(false);
	async function logout() {
		await app.logout();
		await goto('/login');
	}

	const builtAt = new Date(__POLLRAMP_BUILT_AT__).toLocaleString();
	const ROLE_INFO: Record<Role, string> = {
		admin: 'Everything, including publishing voter pages, importing and managing users',
		surveyor: 'Add and edit sites, run surveys',
		viewer: 'Read-only access to sites, surveys and the kit list'
	};
</script>

<svelte:head><title>Settings · Pollramp</title></svelte:head>

<div class="container-narrow page stack" style="--gap: 1.5rem">
	<h1>Settings</h1>

	<section class="card stack" aria-labelledby="account-h">
		<h2 id="account-h">Your account</h2>
		<dl class="dl">
			<dt>Name</dt>
			<dd>{app.user?.name}</dd>
			<dt>Email</dt>
			<dd>{app.user?.email}</dd>
			<dt>Role</dt>
			<dd>
				{app.user?.role} — <span class="muted">{app.user ? ROLE_INFO[app.user.role] : ''}</span>
			</dd>
		</dl>
		<fieldset class="theme">
			<legend class="label">Appearance</legend>
			<div class="cluster">
				{#each ['system', 'light', 'dark'] as const as t (t)}
					<label class="check">
						<input type="radio" name="theme" checked={theme === t} onchange={() => setTheme(t)} />
						{t === 'system' ? 'Match device' : t === 'light' ? 'Light' : 'Dark'}
					</label>
				{/each}
			</div>
		</fieldset>
		{#if confirmLogout}
			<p class={app.pending ? 'form-error' : ''}>
				{app.pending
					? `${app.pending} change${app.pending === 1 ? ' has' : 's have'} not synced yet and will be lost. Sync first if you can.`
					: 'Signing out removes Pollramp data from this device.'}
			</p>
			<div class="cluster">
				<button class="btn btn-danger" type="button" onclick={logout}>Sign out</button>
				<button class="btn btn-ghost" type="button" onclick={() => (confirmLogout = false)}>
					Cancel
				</button>
			</div>
		{:else}
			<button class="btn" type="button" onclick={() => (confirmLogout = true)}>Sign out…</button>
		{/if}
	</section>

	<section class="card stack" aria-labelledby="sync-h">
		<h2 id="sync-h">Sync and offline</h2>
		<dl class="dl">
			<dt>Connection</dt>
			<dd>{app.online && app.serverReachable !== false ? 'Online' : 'Offline'}</dd>
			<dt>Last sync</dt>
			<dd>{app.lastSync ? new Date(app.lastSync).toLocaleString() : 'Never'}</dd>
			<dt>Waiting to sync</dt>
			<dd>{app.pending} change{app.pending === 1 ? '' : 's'}</dd>
			<dt>On this device</dt>
			<dd>
				{app.activeSites.length} sites, {app.surveys.length} surveys, {app.photos.length} photos
			</dd>
		</dl>
		{#if app.syncError}<p class="form-error">{app.syncError}</p>{/if}
		<div class="cluster">
			<button
				class="btn btn-primary"
				type="button"
				onclick={() => app.sync()}
				disabled={app.syncing}
			>
				Sync now
			</button>
			<button
				class="btn"
				type="button"
				onclick={() => app.sync({ full: true })}
				disabled={app.syncing}
			>
				Re-download everything
			</button>
		</div>
		<p class="hint">
			Pollramp keeps working without a connection. Install it from your browser menu (“Add to Home
			Screen” or “Install app”) to open it like any other app in the field.
		</p>
	</section>

	{#if app.user?.role === 'admin'}
		<section class="card stack" aria-labelledby="users-h">
			<h2 id="users-h">People</h2>
			{#if users}
				<div class="table-wrap">
					<table class="table">
						<thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
						<tbody>
							{#each users as u (u.id)}
								<tr>
									<td>{u.name}</td><td>{u.email}</td><td>
										{u.role}{u.disabled ? ' (disabled)' : ''}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			<form class="stack" onsubmit={addUser}>
				<h3>Add a person</h3>
				<div class="grid-auto" style="--min: 200px">
					<div class="field">
						<label for="u-name">Name</label><input id="u-name" bind:value={newUser.name} required />
					</div>
					<div class="field">
						<label for="u-email">Email</label><input
							id="u-email"
							type="email"
							bind:value={newUser.email}
							required
						/>
					</div>
					<div class="field">
						<label for="u-role">Role</label>
						<select id="u-role" bind:value={newUser.role}>
							<option value="surveyor">Surveyor</option>
							<option value="viewer">Viewer</option>
							<option value="admin">Administrator</option>
						</select>
					</div>
					<div class="field">
						<label for="u-pw">Temporary password</label>
						<input
							id="u-pw"
							type="password"
							autocomplete="new-password"
							bind:value={newUser.password}
							required
							minlength="10"
						/>
					</div>
				</div>
				{#if usersError}<p class="form-error" role="alert">{usersError}</p>{/if}
				{#if userMessage}<p class="form-ok" role="status">{userMessage}</p>{/if}
				<button class="btn btn-primary" type="submit">Add person</button>
			</form>
		</section>
	{/if}

	<section class="card stack" aria-labelledby="data-h">
		<h2 id="data-h">Exports and open data</h2>
		<ul class="links">
			<li>
				<a href="/api/export/results.csv" download>Results by site (CSV)</a> — one row per polling place,
				for Excel.
			</li>
			<li>
				<a href="/api/export/items.csv" download>Every measurement (CSV)</a> — one row per site and checklist
				item.
			</li>
			<li><a href="/api/export/kit.csv" download>Election-day kit totals (CSV)</a></li>
			<li>
				<a href="/api/public/sites.geojson">Published sites (GeoJSON)</a> — open data for maps and partners.
			</li>
		</ul>
	</section>

	<section class="card stack" aria-labelledby="cl-h">
		<h2 id="cl-h">Checklists</h2>
		<p class="muted">
			Versioned checklist data, released under CC0. Each survey records the exact version it used.
		</p>
		<ul class="links">
			{#each bases as b (`${b.id}@${b.version}`)}
				<li><strong>{b.title}</strong> <span class="tag">{b.id}@{b.version}</span></li>
			{/each}
			{#each overlays as o (`${o.id}@${o.version}`)}
				<li>
					<strong>{o.title}</strong> <span class="tag">{o.id}@{o.version}</span>
					<span class="small muted">extends {o.extends.id} {o.extends.version}</span>
				</li>
			{/each}
		</ul>
		<a class="btn" href="/settings/checklists">Browse checklist items and diagrams</a>
	</section>

	<section class="card stack" aria-labelledby="about-h">
		<h2 id="about-h">About Pollramp</h2>
		<dl class="dl">
			<dt>Version</dt>
			<dd>{__POLLRAMP_VERSION__}</dd>
			<dt>Build</dt>
			<dd>{__POLLRAMP_BUILD__}</dd>
			<dt>Commit</dt>
			<dd class="mono">{__POLLRAMP_COMMIT__.slice(0, 12)}</dd>
			<dt>Built</dt>
			<dd>{builtAt}</dd>
			{#if app.config && app.config.build !== __POLLRAMP_BUILD__}
				<dt>Server</dt>
				<dd>{app.config.version} (build {app.config.build}) — reload to update</dd>
			{/if}
		</dl>
		<p class="small muted">
			Free software under the GNU AGPL v3. Checklist data is public domain (CC0).
			<a href="https://github.com/lobojoel2003/Pollramp">Source code and documentation</a>.
		</p>
	</section>
</div>

<style>
	.dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.4rem 1rem;
		margin: 0;
	}
	.dl dt {
		font-weight: 700;
	}
	.dl dd {
		margin: 0;
	}
	.theme {
		border: 0;
		padding: 0;
		margin: 0;
	}
	.links {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.4rem;
	}
</style>
