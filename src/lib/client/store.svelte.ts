import { evaluateSurvey } from '../checklist/evaluate.ts';
import { defaultChecklistKey, tryGetChecklist } from '../checklist/registry.ts';
import type { Responses, SiteStatus } from '../checklist/types.ts';
import {
	EMPTY_VOTER_INFO,
	slugify,
	uuid,
	type AppConfig,
	type PhotoMeta,
	type Site,
	type Survey,
	type SyncResponse,
	type User
} from '../model.ts';
import { api, ApiError } from './api.ts';
import {
	clearLocalData,
	getMeta,
	localDb,
	setMeta,
	type LocalPhoto,
	type LocalSite,
	type LocalSurvey
} from './idb.ts';
import { blobUrl, resizeImage } from './photos.ts';

const now = () => new Date().toISOString();
const newer = (a: string, b: string) => new Date(a).getTime() > new Date(b).getTime();

/**
 * Offline-first application state. IndexedDB is the source of truth on the device;
 * the server is synced in the background whenever it can be reached.
 */
class AppState {
	ready = $state(false);
	user = $state<User | null>(null);
	needsSetup = $state(false);
	config = $state<AppConfig | null>(null);

	online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
	serverReachable = $state<boolean | null>(null);
	syncing = $state(false);
	lastSync = $state<string | null>(null);
	syncError = $state<string | null>(null);

	sites = $state<LocalSite[]>([]);
	surveys = $state<LocalSurvey[]>([]);
	photos = $state<Omit<LocalPhoto, 'blob'>[]>([]);

	pending = $derived(
		this.sites.filter((s) => s.dirty).length +
			this.surveys.filter((s) => s.dirty).length +
			this.photos.filter((p) => !p.synced).length
	);

	activeSites = $derived(
		this.sites.filter((s) => !s.deletedAt).sort((a, b) => a.name.localeCompare(b.name))
	);

	#syncTimer: ReturnType<typeof setTimeout> | undefined;
	#interval: ReturnType<typeof setInterval> | undefined;
	#started = false;

	/* ------------------------------------------------------------ lifecycle */

	async start(): Promise<void> {
		if (this.#started) return;
		this.#started = true;
		const db = await localDb();
		const [sites, surveys, photos, user, config, lastSync] = await Promise.all([
			db.getAll('sites'),
			db.getAll('surveys'),
			db.getAll('photos'),
			getMeta<User>('user'),
			getMeta<AppConfig>('config'),
			getMeta<string>('lastSync')
		]);
		this.sites = sites;
		this.surveys = surveys;
		this.photos = photos.map(({ blob: _blob, ...meta }) => meta);
		this.user = user ?? null;
		this.config = config ?? null;
		this.lastSync = lastSync ?? null;

		window.addEventListener('online', () => {
			this.online = true;
			void this.sync();
		});
		window.addEventListener('offline', () => {
			this.online = false;
		});
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') void this.sync();
		});
		this.#interval = setInterval(() => void this.sync(), 60_000);

		await Promise.all([this.refreshSession(), this.refreshConfig()]);
		this.ready = true;
		void this.sync();
	}

	async refreshSession(): Promise<void> {
		try {
			const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
			const body = (await res.json()) as { user: User | null; needsSetup: boolean };
			this.serverReachable = true;
			this.needsSetup = body.needsSetup;
			if (body.user) {
				this.user = body.user;
				await setMeta('user', $state.snapshot(body.user));
			} else {
				this.user = null;
				await setMeta('user', null);
			}
		} catch {
			// Offline: keep the cached user so surveyors can keep working.
			this.serverReachable = false;
		}
	}

	async refreshConfig(): Promise<void> {
		try {
			this.config = await api<AppConfig>('/api/config');
			await setMeta('config', $state.snapshot(this.config));
		} catch {
			/* keep cached */
		}
	}

	async login(email: string, password: string): Promise<void> {
		const { user } = await api<{ user: User }>('/api/auth/login', {
			method: 'POST',
			json: { email, password }
		});
		await this.#becomeUser(user);
	}

	async setup(name: string, email: string, password: string): Promise<void> {
		const { user } = await api<{ user: User }>('/api/auth/setup', {
			method: 'POST',
			json: { name, email, password }
		});
		this.needsSetup = false;
		await this.#becomeUser(user);
	}

	async #becomeUser(user: User): Promise<void> {
		const previous = await getMeta<User>('user');
		// A different person signing in on a shared tablet must not inherit the last user's data.
		if (previous && previous.id !== user.id && this.pending === 0) await this.#wipe();
		this.user = user;
		await setMeta('user', user);
		await this.sync({ full: true });
	}

	async logout(): Promise<void> {
		try {
			await api('/api/auth/logout', { method: 'POST' });
		} catch {
			/* offline logout still clears the device */
		}
		await this.#wipe();
		this.user = null;
	}

	async #wipe(): Promise<void> {
		await clearLocalData();
		if ('caches' in window) {
			await Promise.all(
				['pollramp-photos-v1', 'pollramp-pages-v1'].map((name) => caches.delete(name))
			);
		}
		this.sites = [];
		this.surveys = [];
		this.photos = [];
		this.lastSync = null;
	}

	/* ------------------------------------------------------------ queries */

	site(id: string): LocalSite | undefined {
		return this.sites.find((s) => s.id === id);
	}

	survey(id: string): LocalSurvey | undefined {
		return this.surveys.find((s) => s.id === id);
	}

	surveysFor(siteId: string): LocalSurvey[] {
		return this.surveys
			.filter((s) => s.siteId === siteId && !s.deletedAt)
			.sort((a, b) => (b.submittedAt ?? b.updatedAt).localeCompare(a.submittedAt ?? a.updatedAt));
	}

	/** Latest submitted survey, used for status and kit (matches the server's rule). */
	latestSubmitted(siteId: string): LocalSurvey | undefined {
		return this.surveysFor(siteId)
			.filter((s) => s.state === 'submitted')
			.sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))[0];
	}

	/** Status computed on the device so it is right even before syncing. */
	statusOf(siteId: string): SiteStatus {
		const latest = this.latestSubmitted(siteId);
		if (latest?.result) return latest.result.status;
		if (latest) return 'incomplete';
		return this.surveysFor(siteId).length ? 'incomplete' : 'unsurveyed';
	}

	photosFor(surveyId: string, itemId?: string): Omit<LocalPhoto, 'blob'>[] {
		return this.photos.filter((p) => p.surveyId === surveyId && (!itemId || p.itemId === itemId));
	}

	async photoUrl(id: string): Promise<string> {
		const photo = await (await localDb()).get('photos', id);
		if (photo?.blob) return blobUrl(id, photo.blob);
		return `/api/photos/${id}`;
	}

	/* ------------------------------------------------------------ mutations */

	async saveSite(input: Partial<Site> & Pick<Site, 'name'>): Promise<LocalSite> {
		const existing = input.id ? this.site(input.id) : undefined;
		const site: LocalSite = {
			id: input.id ?? uuid(),
			slug: input.slug ?? existing?.slug ?? slugify(input.name),
			name: input.name,
			address: input.address ?? '',
			city: input.city ?? '',
			state: (input.state ?? '').toUpperCase(),
			postalCode: input.postalCode ?? '',
			lat: input.lat ?? null,
			lng: input.lng ?? null,
			precincts: input.precincts ?? [],
			notes: input.notes ?? '',
			published: input.published ?? false,
			voterInfo: { ...EMPTY_VOTER_INFO, ...input.voterInfo },
			publicPhotoId: input.publicPhotoId ?? null,
			status: existing?.status ?? 'unsurveyed',
			latestSurveyId: existing?.latestSurveyId ?? null,
			createdAt: existing?.createdAt ?? now(),
			updatedAt: now(),
			deletedAt: null,
			dirty: true
		};
		await this.#putSite(site);
		this.scheduleSync();
		return site;
	}

	async startSurvey(siteId: string, checklistKey?: string): Promise<LocalSurvey> {
		const site = this.site(siteId);
		const key = checklistKey ?? defaultChecklistKey(site?.state || this.config?.defaultState);
		const survey: LocalSurvey = {
			id: uuid(),
			siteId,
			checklist: key,
			state: 'draft',
			surveyor: this.user?.name ?? '',
			election: '',
			responses: {},
			result: null,
			startedAt: now(),
			submittedAt: null,
			createdAt: now(),
			updatedAt: now(),
			deletedAt: null,
			dirty: true
		};
		survey.result = this.#evaluate(survey.checklist, survey.responses);
		await this.#putSurvey(survey);
		this.scheduleSync();
		return survey;
	}

	async saveSurvey(
		id: string,
		patch: Partial<Pick<Survey, 'responses' | 'surveyor' | 'election' | 'state' | 'checklist'>>
	): Promise<LocalSurvey> {
		const current = this.survey(id);
		if (!current) throw new Error('Survey not found on this device.');
		const next: LocalSurvey = {
			...$state.snapshot(current),
			...patch,
			updatedAt: now(),
			dirty: true
		};
		if (patch.state === 'submitted' && current.state !== 'submitted') next.submittedAt = now();
		if (patch.state === 'draft') next.submittedAt = null;
		next.result = this.#evaluate(next.checklist, next.responses);
		await this.#putSurvey(next);
		this.scheduleSync();
		return next;
	}

	async deleteSurvey(id: string): Promise<void> {
		const survey = this.survey(id);
		if (!survey) return;
		await api(`/api/surveys/${id}`, { method: 'DELETE' }).catch((e: unknown) => {
			if (!(e instanceof ApiError && e.status === 404)) throw e;
		});
		await this.#putSurvey({ ...$state.snapshot(survey), deletedAt: now(), dirty: false });
	}

	async deleteSite(id: string): Promise<void> {
		await api(`/api/sites/${id}`, { method: 'DELETE' });
		const db = await localDb();
		await db.delete('sites', id);
		this.sites = this.sites.filter((s) => s.id !== id);
		this.surveys = this.surveys.filter((s) => s.siteId !== id);
	}

	async addPhoto(surveyId: string, itemId: string, file: File): Promise<string> {
		const { blob, width, height, mime } = await resizeImage(file);
		const photo: LocalPhoto = {
			id: uuid(),
			surveyId,
			itemId,
			mime,
			width,
			height,
			size: blob.size,
			createdAt: now(),
			blob,
			synced: false
		};
		await (await localDb()).put('photos', photo);
		const { blob: _blob, ...meta } = photo;
		this.photos = [...this.photos, meta];
		this.scheduleSync();
		return photo.id;
	}

	#evaluate(key: string, responses: Responses) {
		const checklist = tryGetChecklist(key);
		return checklist ? evaluateSurvey(checklist, responses) : null;
	}

	/**
	 * Memory is updated synchronously so a read-modify-write (two quick answers, or a sync
	 * acknowledgement arriving mid-edit) can never interleave; IndexedDB writes are queued in order.
	 */
	#putSite(site: LocalSite): Promise<void> {
		const plain: LocalSite = $state.snapshot(site);
		const index = this.sites.findIndex((s) => s.id === site.id);
		if (index >= 0) this.sites[index] = plain;
		else this.sites.push(plain);
		return this.#persist(async (db) => {
			await db.put('sites', plain);
		});
	}

	#putSurvey(survey: LocalSurvey): Promise<void> {
		const plain: LocalSurvey = $state.snapshot(survey);
		const index = this.surveys.findIndex((s) => s.id === survey.id);
		if (index >= 0) this.surveys[index] = plain;
		else this.surveys.push(plain);
		return this.#persist(async (db) => {
			await db.put('surveys', plain);
		});
	}

	#writes: Promise<void> = Promise.resolve();

	#persist(write: (db: Awaited<ReturnType<typeof localDb>>) => Promise<void>): Promise<void> {
		this.#writes = this.#writes
			.then(async () => write(await localDb()))
			.catch((error: unknown) => {
				console.error('Could not save to this device', error);
			});
		return this.#writes;
	}

	/* ------------------------------------------------------------ sync */

	scheduleSync(delay = 1500): void {
		clearTimeout(this.#syncTimer);
		this.#syncTimer = setTimeout(() => void this.sync(), delay);
	}

	/** Push local changes (sites → surveys → photos), then pull server changes. */
	async sync({ full = false }: { full?: boolean } = {}): Promise<void> {
		if (this.syncing || !this.user || typeof window === 'undefined') return;
		this.syncing = true;
		this.syncError = null;
		try {
			for (const site of this.sites.filter((s) => s.dirty)) {
				const sent = $state.snapshot(site);
				const { site: saved } = await api<{ site: Site; stale: boolean }>(`/api/sites/${site.id}`, {
					method: 'PUT',
					json: sent
				});
				await this.#acknowledgeSite(sent.updatedAt, saved);
			}
			for (const survey of this.surveys.filter((s) => s.dirty && !s.deletedAt)) {
				const sent = $state.snapshot(survey);
				const { survey: saved } = await api<{ survey: Survey; stale: boolean }>(
					`/api/surveys/${survey.id}`,
					{
						method: 'PUT',
						json: sent
					}
				);
				await this.#acknowledgeSurvey(sent.updatedAt, saved);
			}
			await this.#pushPhotos();

			const since = full ? null : this.lastSync;
			const changes = await api<SyncResponse>(
				`/api/sync${since ? `?since=${encodeURIComponent(since)}` : ''}`
			);
			await this.#merge(changes);
			this.lastSync = changes.now;
			await setMeta('lastSync', changes.now);
			this.serverReachable = true;
		} catch (error) {
			if (error instanceof ApiError && error.offline) {
				this.serverReachable = false;
			} else if (error instanceof ApiError && error.status === 401) {
				this.user = null;
				await setMeta('user', null);
			} else {
				this.syncError = error instanceof Error ? error.message : String(error);
			}
		} finally {
			this.syncing = false;
		}
	}

	async #acknowledgeSite(sentAt: string, saved: Site): Promise<void> {
		const local = this.site(saved.id);
		// Keep `dirty` if the user edited the site again while the request was in flight.
		if (local && local.updatedAt !== sentAt && newer(local.updatedAt, sentAt)) return;
		await this.#putSite({ ...saved, dirty: false });
	}

	async #acknowledgeSurvey(sentAt: string, saved: Survey): Promise<void> {
		const local = this.survey(saved.id);
		if (local && newer(local.updatedAt, sentAt)) return;
		await this.#putSurvey({ ...saved, dirty: false });
	}

	async #pushPhotos(): Promise<void> {
		const db = await localDb();
		for (const meta of this.photos.filter((p) => !p.synced)) {
			const survey = this.survey(meta.surveyId);
			if (!survey || survey.dirty) continue; // the survey must reach the server first
			const photo = await db.get('photos', meta.id);
			if (!photo?.blob) continue;
			const headers: Record<string, string> = {
				'Content-Type': photo.mime,
				'X-Pollramp-Survey': photo.surveyId,
				'X-Pollramp-Item': photo.itemId
			};
			if (photo.width) headers['X-Pollramp-Width'] = String(photo.width);
			if (photo.height) headers['X-Pollramp-Height'] = String(photo.height);
			await api(`/api/photos/${photo.id}`, { method: 'PUT', headers, body: photo.blob });
			await db.put('photos', { ...photo, synced: true });
			this.photos = this.photos.map((p) => (p.id === photo.id ? { ...p, synced: true } : p));
		}
	}

	async #merge(changes: SyncResponse): Promise<void> {
		const db = await localDb();
		for (const remote of changes.sites) {
			const local = this.site(remote.id);
			if (local?.dirty && !newer(remote.updatedAt, local.updatedAt)) continue;
			if (remote.deletedAt) {
				this.sites = this.sites.filter((s) => s.id !== remote.id);
				await this.#persist(async (d) => {
					await d.delete('sites', remote.id);
				});
			} else {
				void this.#putSite({ ...remote, dirty: false });
			}
		}
		for (const remote of changes.surveys) {
			const local = this.survey(remote.id);
			if (local?.dirty && !newer(remote.updatedAt, local.updatedAt)) continue;
			void this.#putSurvey({ ...remote, dirty: false });
		}
		await this.#writes;
		const known = new Set(this.photos.map((p) => p.id));
		const incoming: PhotoMeta[] = changes.photos.filter((p) => !known.has(p.id));
		for (const meta of incoming) await db.put('photos', { ...meta, synced: true });
		if (incoming.length)
			this.photos = [...this.photos, ...incoming.map((p) => ({ ...p, synced: true }))];
	}

	stop(): void {
		clearInterval(this.#interval);
		clearTimeout(this.#syncTimer);
	}
}

export const app = new AppState();
