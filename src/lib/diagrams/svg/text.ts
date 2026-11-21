/**
 * Rough advance width of a label, in px, for the bold diagram font (Atkinson Hyperlegible,
 * which is wider than most fallbacks). Used to size the backing box behind dimension labels.
 */
export function textWidth(text: string, size = 14): number {
	let em = 0;
	for (const ch of text) {
		if (ch === ' ') em += 0.32;
		else if (/[0-9]/.test(ch)) em += 0.63;
		else if (/[il.,:;|!'j]/.test(ch)) em += 0.31;
		else if (/[frt()/]/.test(ch)) em += 0.4;
		else if (/[mw%MW]/.test(ch)) em += 0.9;
		else if (/[A-Z]/.test(ch)) em += 0.7;
		else em += 0.58;
	}
	return em * size;
}
