// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from '#lib/model.ts';

declare global {
	namespace App {
		interface Error {
			status: number;
			message: string;
		}
		interface Locals {
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
