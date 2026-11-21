// Fictional demo polling places and survey answers, shared by scripts/seed-demo.js and the
// end-to-end tests. All names and addresses are invented.

export const CHECKLIST = 'doj-base@1.0.0+us-va@1.0.0';

const yes = { value: true };
const no = { value: false };
/** @param {number} value */
const n = (value) => ({ value });
/** @param {string} value */
const s = (value) => ({ value });

/**
 * Every item answered so that the site passes; individual sites then override answers.
 * @returns {Record<string, { value: unknown; na?: boolean }>}
 */
export function compliant() {
	return {
		'parking.provided': yes,
		'parking.total-spaces': n(48),
		'parking.accessible-spaces': n(2),
		'parking.van-spaces': n(1),
		'parking.space-width': n(98),
		'parking.aisle-width': n(62),
		'parking.van-combined-width': n(194),
		'parking.van-covered': no,
		'parking.surface-slope': n(1.4),
		'parking.signs': yes,
		'parking.sign-height': n(64),
		'parking.van-sign': yes,
		'parking.nearest-entrance': yes,
		'dropoff.provided': yes,
		'dropoff.aisle-width': n(60),
		'dropoff.aisle-length': n(22),
		'dropoff.slope': n(1.2),
		'dropoff.level-access': yes,
		'curbside.location': yes,
		'curbside.sign': yes,
		'curbside.call': yes,
		'curbside.staffed': yes,
		'route.level-change': n(0.25),
		'route.width': n(60),
		'route.surface': s('paved'),
		'route.running-slope': n(2.5),
		'route.cross-slope': n(1.5),
		'route.openings': no,
		'route.protruding': no,
		'route.headroom': { value: null, na: true },
		'route.signage': s('same'),
		'curb-ramps.present': yes,
		'curb-ramps.provided': yes,
		'curb-ramps.slope': n(7.5),
		'curb-ramps.flare-slope': n(8),
		'curb-ramps.landing': n(40),
		'curb-ramps.clear': yes,
		'ramps.present': no,
		'entrance.is-main': yes,
		'entrance.unlocked': yes,
		'entrance.clear-width': n(34),
		'entrance.threshold': n(0.25),
		'entrance.hardware': s('push-pull'),
		'entrance.hardware-height': n(40),
		'entrance.opening-force': n(4),
		'entrance.closing-speed': n(6),
		'entrance.maneuvering': yes,
		'entrance.vestibule': s('none'),
		'interior.width': n(72),
		'interior.level-change': n(0),
		'interior.protruding': no,
		'interior.door-width': n(34),
		'interior.door-force': n(4.5),
		'interior.same-floor': yes,
		'voting-area.aisle-width': n(48),
		'voting-area.turning-space': yes,
		'voting-area.check-in-height': n(30),
		'voting-area.accessible-system': yes,
		'voting-area.booth-clear-space': yes,
		'voting-area.booth-height': n(30),
		'voting-area.knee-clearance': n(28),
		'voting-area.reach': n(42),
		'voting-area.privacy': yes,
		'voting-area.cords': yes,
		'voting-area.seating': yes,
		'voting-area.lighting': yes,
		'voting-area.aids': yes
	};
}

export const SITES = [
	{
		name: 'Oak Hill Elementary School',
		address: '2100 Oak Hill Road',
		precincts: ['204'],
		at: [37.5536, -77.4823],
		published: true,
		voter: {
			accessibleEntrance:
				'Use the gym entrance on Laurel Street, next to the bus loop. It is marked with a blue sign.',
			parking:
				'Accessible spaces, including one van-accessible space, are in the front row of the Laurel Street lot.',
			contact: 'Call the election office at (555) 010-0142.'
		},
		answers: {
			'entrance.is-main': no,
			'entrance.signs': no,
			'entrance.threshold': { value: 1.75, raw: '1 3/4' },
			'parking.total-spaces': n(120),
			'parking.accessible-spaces': n(3)
		}
	},
	{
		name: 'Riverside Community Church',
		address: '400 River Bend Drive',
		precincts: ['105', '106'],
		at: [37.5321, -77.4512],
		published: true,
		voter: {
			accessibleEntrance: 'The main entrance on River Bend Drive has a power-assisted door.',
			parking: 'Accessible spaces are directly in front of the main doors.',
			contact: 'Call (555) 010-0142 with questions.'
		},
		answers: { 'entrance.hardware': s('automatic') }
	},
	{
		name: 'Maple Grove Public Library',
		address: '1550 Maple Grove Avenue',
		precincts: ['301'],
		at: [37.5715, -77.4401],
		published: true,
		voter: {
			accessibleEntrance: 'Main entrance, level with the sidewalk.',
			parking: 'Accessible parking on the north side of the building.',
			contact: '(555) 010-0142'
		},
		answers: { 'dropoff.provided': no }
	},
	{
		name: 'Northside Recreation Center',
		address: '3300 Northside Parkway',
		precincts: ['402'],
		at: [37.5912, -77.4655],
		published: true,
		voter: {
			accessibleEntrance:
				'Use the front doors. A poll worker will hold the second set of doors open.',
			parking: 'Accessible parking next to the playground entrance.',
			contact: '(555) 010-0142'
		},
		answers: {
			'entrance.opening-force': n(9),
			'entrance.hardware': s('knob'),
			'voting-area.seating': no,
			'voting-area.aids': no
		}
	},
	{
		name: 'Union Hill Fire Station 12',
		address: '815 Union Hill Street',
		precincts: ['118'],
		at: [37.5402, -77.4198],
		published: false,
		answers: {
			'ramps.present': yes,
			'ramps.slope': n(11.2),
			'ramps.cross-slope': n(1.8),
			'ramps.width': n(42),
			'ramps.rise': n(14),
			'ramps.landings': yes,
			'ramps.handrails': yes,
			'ramps.handrail-height': n(36),
			'ramps.edge-protection': yes,
			'ramps.surface': no
		}
	},
	{
		name: 'Westover Middle School',
		address: '6200 Westover Hills Boulevard',
		precincts: ['510', '511'],
		at: [37.5087, -77.4884],
		published: true,
		voter: {
			accessibleEntrance:
				'Use the cafeteria entrance at the back of the school. Follow the blue signs from the parking lot.',
			parking: 'Accessible spaces are in the back lot near the cafeteria.',
			contact: '(555) 010-0142'
		},
		answers: {
			'route.level-change': { value: 4, raw: '4' },
			'route.signage': s('no'),
			'entrance.is-main': no,
			'entrance.signs': no
		}
	},
	{
		name: "St. Brendan's Parish Hall",
		address: '920 Chesterfield Lane',
		precincts: ['612'],
		at: [37.4978, -77.4523],
		published: false,
		answers: {
			'route.cross-slope': n(3.6),
			'interior.same-floor': no,
			'interior.elevator': no
		}
	},
	{
		name: 'Fairmount Senior Center',
		address: '1801 Fairmount Avenue',
		precincts: ['121'],
		at: [37.5462, -77.4089],
		draft: true,
		answers: {}
	},
	{
		name: 'Jefferson Park Pavilion',
		address: '200 Jefferson Park Drive',
		precincts: ['130'],
		at: [37.5268, -77.4011],
		unsurveyed: true
	},
	{
		name: 'Hillcrest High School Gymnasium',
		address: '7400 Hillcrest Road',
		precincts: ['701', '702'],
		at: [37.6021, -77.5012],
		published: true,
		voter: {
			accessibleEntrance: 'Gym lobby doors on the east side; automatic door button on the right.',
			parking: 'Six accessible spaces, two van-accessible, in the east lot.',
			contact: '(555) 010-0142'
		},
		answers: {
			'parking.total-spaces': n(260),
			'parking.accessible-spaces': n(7),
			'parking.van-spaces': n(2),
			'entrance.hardware': s('automatic')
		}
	},
	{
		name: 'Chestnut Street Masonic Lodge',
		address: '55 Chestnut Street',
		precincts: ['144'],
		at: [37.5601, -77.4302],
		published: true,
		voter: {
			accessibleEntrance:
				'Side door on Chestnut Street. Ring the doorbell and a poll worker will help.',
			parking: 'Street parking only; use the drop-off zone in front of the side door.',
			contact: '(555) 010-0142'
		},
		answers: {
			'parking.provided': no,
			'entrance.unlocked': no,
			'voting-area.lighting': no,
			'voting-area.privacy': no,
			'voting-area.check-in-height': n(36)
		}
	},
	{
		name: 'Brookfield Elementary School',
		address: '3900 Brookfield Road',
		precincts: ['215'],
		at: [37.5795, -77.4126],
		unsurveyed: true
	}
];

/**
 * Drop answers for items that a gate or earlier answer makes irrelevant (keeps data realistic).
 * @param {{ answers?: Record<string, { value: unknown; na?: boolean; raw?: string }> }} site
 * @returns {Record<string, { value: unknown; na?: boolean; raw?: string; answeredAt?: string }>}
 */
export function responsesFor(site) {
	/** @type {Record<string, { value: unknown; na?: boolean; raw?: string; answeredAt?: string }>} */
	const all = { ...compliant(), ...site.answers };
	if (all['parking.provided'].value === false) {
		for (const key of Object.keys(all))
			if (key.startsWith('parking.') && key !== 'parking.provided') delete all[key];
	}
	if (all['dropoff.provided'].value === false) {
		for (const key of Object.keys(all))
			if (key.startsWith('dropoff.') && key !== 'dropoff.provided') delete all[key];
	}
	const now = new Date().toISOString();
	for (const value of Object.values(all)) value.answeredAt = now;
	return all;
}
