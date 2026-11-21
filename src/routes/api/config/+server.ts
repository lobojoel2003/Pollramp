import { json } from '@sveltejs/kit';
import { publicConfig } from '#lib/server/config.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json(publicConfig());
