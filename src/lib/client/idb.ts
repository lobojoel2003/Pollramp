import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PhotoMeta, Site, Survey } from '../model.ts';

/** Local records carry `dirty` until the server has acknowledged the latest edit. */
export type LocalSite = Site & { dirty?: boolean };
export type LocalSurvey = Survey & { dirty?: boolean };
export type LocalPhoto = PhotoMeta & { blob?: Blob; synced: boolean };

interface PollrampDB extends DBSchema {
	sites: { key: string; value: LocalSite };
	surveys: { key: string; value: LocalSurvey; indexes: { siteId: string } };
	photos: { key: string; value: LocalPhoto; indexes: { surveyId: string } };
	meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<PollrampDB>> | undefined;

export function localDb(): Promise<IDBPDatabase<PollrampDB>> {
	dbPromise ??= openDB<PollrampDB>('pollramp', 1, {
		upgrade(db) {
			db.createObjectStore('sites', { keyPath: 'id' });
			const surveys = db.createObjectStore('surveys', { keyPath: 'id' });
			surveys.createIndex('siteId', 'siteId');
			const photos = db.createObjectStore('photos', { keyPath: 'id' });
			photos.createIndex('surveyId', 'surveyId');
			db.createObjectStore('meta');
		}
	});
	return dbPromise;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
	return (await (await localDb()).get('meta', key)) as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
	await (await localDb()).put('meta', value, key);
}

export async function clearLocalData(): Promise<void> {
	const db = await localDb();
	const tx = db.transaction(['sites', 'surveys', 'photos', 'meta'], 'readwrite');
	await Promise.all([
		tx.objectStore('sites').clear(),
		tx.objectStore('surveys').clear(),
		tx.objectStore('photos').clear(),
		tx.objectStore('meta').clear(),
		tx.done
	]);
}
