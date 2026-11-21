/** Fetch wrapper for the Pollramp API. Network failures become `ApiError` with `offline: true`. */
export class ApiError extends Error {
	name = 'ApiError';
	status: number;
	offline: boolean;
	constructor(message: string, status: number, offline = false) {
		super(message);
		this.status = status;
		this.offline = offline;
	}
}

export async function api<T>(
	path: string,
	init: RequestInit & { json?: unknown } = {}
): Promise<T> {
	const { json, ...rest } = init;
	const headers = new Headers(rest.headers);
	if (json !== undefined) headers.set('Content-Type', 'application/json');
	headers.set('Accept', 'application/json');
	let response: Response;
	try {
		response = await fetch(path, {
			credentials: 'same-origin',
			...rest,
			headers,
			body: json !== undefined ? JSON.stringify(json) : rest.body
		});
	} catch {
		throw new ApiError('You appear to be offline.', 0, true);
	}
	if (!response.ok) {
		let message = response.statusText || `Request failed (${response.status})`;
		try {
			const body = (await response.json()) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			/* not JSON */
		}
		throw new ApiError(
			message,
			response.status,
			response.status === 503 || response.status === 504
		);
	}
	return (await response.json()) as T;
}
