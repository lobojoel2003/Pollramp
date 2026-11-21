/** Shrink camera photos before storing them offline: long edge ≤ 1600 px, JPEG ~0.82. */
export async function resizeImage(
	file: Blob,
	maxEdge = 1600,
	quality = 0.82
): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not available.');
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	const blob = await new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error('Could not encode the photo.'))),
			'image/jpeg',
			quality
		)
	);
	return { blob, width, height, mime: 'image/jpeg' };
}

const urls = new Map<string, string>();

/** Object URL for a locally stored photo blob, created once per id. */
export function blobUrl(id: string, blob: Blob): string {
	let url = urls.get(id);
	if (!url) {
		url = URL.createObjectURL(blob);
		urls.set(id, url);
	}
	return url;
}
