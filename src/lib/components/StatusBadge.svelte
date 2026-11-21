<script lang="ts">
	import { STATUS } from '../checklist/status.ts';
	import type { SiteStatus } from '../checklist/types.ts';

	interface Props {
		status: SiteStatus | 'na';
		/** Voter-facing wording. */
		public?: boolean;
		short?: boolean;
	}

	let { status, public: isPublic = false, short = false }: Props = $props();

	const PUBLIC_LABEL: Record<SiteStatus | 'na', string> = {
		accessible: 'Accessible',
		fixable: 'Accessible on election day',
		barriers: 'Some barriers',
		incomplete: 'Not yet surveyed',
		unsurveyed: 'Not yet surveyed',
		na: 'Not applicable'
	};

	const info = $derived(
		status === 'na' ? { label: 'Not applicable', short: 'N/A', glyph: '–' } : STATUS[status]
	);
	const label = $derived(isPublic ? PUBLIC_LABEL[status] : short ? info.short : info.label);
	const cls = $derived(isPublic && status === 'incomplete' ? 'unsurveyed' : status);
</script>

<span class="status s-{cls}">
	<span class="status-glyph" aria-hidden="true">{info.glyph}</span>
	{label}
</span>
