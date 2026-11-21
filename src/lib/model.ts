import type { Responses, SiteStatus, SurveyResult } from './checklist/types.ts';

/** What the office publishes on the voter-facing page, in its own words. */
export interface VoterInfo {
	/** "Use the north door on Elm Street, next to the playground." */
	accessibleEntrance: string;
	/** "Accessible spaces are in the front row of the east lot." */
	parking: string;
	/** Phone or email voters can use to ask about accessibility. */
	contact: string;
	/** Anything else voters should know. */
	notes: string;
}

export const EMPTY_VOTER_INFO: VoterInfo = {
	accessibleEntrance: '',
	parking: '',
	contact: '',
	notes: ''
};

export interface Site {
	id: string;
	slug: string;
	name: string;
	address: string;
	city: string;
	state: string;
	postalCode: string;
	lat: number | null;
	lng: number | null;
	precincts: string[];
	notes: string;
	published: boolean;
	voterInfo: VoterInfo;
	publicPhotoId: string | null;
	/** Derived from the latest submitted survey (server-maintained). */
	status: SiteStatus;
	latestSurveyId: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export type SurveyState = 'draft' | 'submitted';

export interface Survey {
	id: string;
	siteId: string;
	/** Resolved checklist key, e.g. `doj-base@1.0.0+us-va@1.0.0`. */
	checklist: string;
	state: SurveyState;
	surveyor: string;
	election: string;
	responses: Responses;
	result: SurveyResult | null;
	startedAt: string;
	submittedAt: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface PhotoMeta {
	id: string;
	surveyId: string;
	itemId: string;
	mime: string;
	width: number | null;
	height: number | null;
	size: number;
	createdAt: string;
}

export type Role = 'admin' | 'surveyor' | 'viewer';

export interface User {
	id: string;
	email: string;
	name: string;
	role: Role;
}

export interface AppConfig {
	officeName: string;
	mapStyleUrl: string;
	defaultCenter: [number, number];
	defaultZoom: number;
	defaultState: string;
	version: string;
	build: string;
	commit: string;
}

export interface SyncResponse {
	now: string;
	sites: Site[];
	surveys: Survey[];
	photos: PhotoMeta[];
}

export const US_STATES: [string, string][] = [
	['AL', 'Alabama'],
	['AK', 'Alaska'],
	['AZ', 'Arizona'],
	['AR', 'Arkansas'],
	['CA', 'California'],
	['CO', 'Colorado'],
	['CT', 'Connecticut'],
	['DE', 'Delaware'],
	['DC', 'District of Columbia'],
	['FL', 'Florida'],
	['GA', 'Georgia'],
	['HI', 'Hawaii'],
	['ID', 'Idaho'],
	['IL', 'Illinois'],
	['IN', 'Indiana'],
	['IA', 'Iowa'],
	['KS', 'Kansas'],
	['KY', 'Kentucky'],
	['LA', 'Louisiana'],
	['ME', 'Maine'],
	['MD', 'Maryland'],
	['MA', 'Massachusetts'],
	['MI', 'Michigan'],
	['MN', 'Minnesota'],
	['MS', 'Mississippi'],
	['MO', 'Missouri'],
	['MT', 'Montana'],
	['NE', 'Nebraska'],
	['NV', 'Nevada'],
	['NH', 'New Hampshire'],
	['NJ', 'New Jersey'],
	['NM', 'New Mexico'],
	['NY', 'New York'],
	['NC', 'North Carolina'],
	['ND', 'North Dakota'],
	['OH', 'Ohio'],
	['OK', 'Oklahoma'],
	['OR', 'Oregon'],
	['PA', 'Pennsylvania'],
	['PR', 'Puerto Rico'],
	['RI', 'Rhode Island'],
	['SC', 'South Carolina'],
	['SD', 'South Dakota'],
	['TN', 'Tennessee'],
	['TX', 'Texas'],
	['UT', 'Utah'],
	['VT', 'Vermont'],
	['VA', 'Virginia'],
	['WA', 'Washington'],
	['WV', 'West Virginia'],
	['WI', 'Wisconsin'],
	['WY', 'Wyoming'],
	['GU', 'Guam'],
	['VI', 'U.S. Virgin Islands'],
	['AS', 'American Samoa'],
	['MP', 'Northern Mariana Islands']
];

/** URL-safe slug for voter-facing pages: "Oak Hill Elementary" → "oak-hill-elementary". */
export function slugify(text: string): string {
	return (
		text
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/&/g, ' and ')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 80) || 'site'
	);
}

export function uuid(): string {
	return crypto.randomUUID();
}
