import { error } from '@sveltejs/kit';

/** Read a JSON body, turning malformed input into a 400 instead of a 500. */
export async function readJson(request: Request, maxBytes = 2 * 1024 * 1024): Promise<unknown> {
	const type = request.headers.get('content-type') ?? '';
	if (!type.includes('application/json'))
		error(415, 'Send JSON with Content-Type: application/json.');
	const length = Number(request.headers.get('content-length') ?? 0);
	if (length > maxBytes) error(413, 'Request body is too large.');
	try {
		return await request.json();
	} catch {
		error(400, 'The request body is not valid JSON.');
	}
}

export function csvResponse(body: string, filename: string): Response {
	return new Response(body, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
}

export function clientKey(request: Request, getClientAddress: () => string): string {
	try {
		return getClientAddress();
	} catch {
		return request.headers.get('x-forwarded-for') ?? 'unknown';
	}
}
