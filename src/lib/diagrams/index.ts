import type { Component } from 'svelte';
import AccessAisle from './svg/AccessAisle.svelte';
import AisleMarking from './svg/AisleMarking.svelte';
import ClearFloorSpace from './svg/ClearFloorSpace.svelte';
import CrossSlope from './svg/CrossSlope.svelte';
import CurbRamp from './svg/CurbRamp.svelte';
import Curbside from './svg/Curbside.svelte';
import DetectableWarning from './svg/DetectableWarning.svelte';
import DoorCloser from './svg/DoorCloser.svelte';
import DoorForce from './svg/DoorForce.svelte';
import DoorHardware from './svg/DoorHardware.svelte';
import DoorWidth from './svg/DoorWidth.svelte';
import Doorbell from './svg/Doorbell.svelte';
import Dropoff from './svg/Dropoff.svelte';
import Elevator from './svg/Elevator.svelte';
import Grating from './svg/Grating.svelte';
import Handrail from './svg/Handrail.svelte';
import Headroom from './svg/Headroom.svelte';
import LevelChange from './svg/LevelChange.svelte';
import Lighting from './svg/Lighting.svelte';
import ManeuveringClearance from './svg/ManeuveringClearance.svelte';
import ParkingCount from './svg/ParkingCount.svelte';
import ParkingOutline from './svg/ParkingOutline.svelte';
import ParkingSpaceLength from './svg/ParkingSpaceLength.svelte';
import ParkingSpaceWidth from './svg/ParkingSpaceWidth.svelte';
import ProtrudingObject from './svg/ProtrudingObject.svelte';
import Ramp from './svg/Ramp.svelte';
import ReachRange from './svg/ReachRange.svelte';
import RouteWidth from './svg/RouteWidth.svelte';
import Seating from './svg/Seating.svelte';
import SignHeight from './svg/SignHeight.svelte';
import Signage from './svg/Signage.svelte';
import Slope from './svg/Slope.svelte';
import Surface from './svg/Surface.svelte';
import TableHeight from './svg/TableHeight.svelte';
import Threshold from './svg/Threshold.svelte';
import TurningSpace from './svg/TurningSpace.svelte';
import VanSpace from './svg/VanSpace.svelte';
import VerticalClearance from './svg/VerticalClearance.svelte';
import Vestibule from './svg/Vestibule.svelte';
import VotingStation from './svg/VotingStation.svelte';

export interface DiagramEntry {
	component: Component;
	title: string;
}

/** Measurement diagrams keyed by the `diagram` id used in checklist items. */
export const diagrams: Record<string, DiagramEntry> = {
	'parking-count': { component: ParkingCount, title: 'Counting parking spaces' },
	'parking-space-width': { component: ParkingSpaceWidth, title: 'Parking space width' },
	'parking-space-length': { component: ParkingSpaceLength, title: 'Parking space length' },
	'parking-outline': { component: ParkingOutline, title: 'Accessible space markings' },
	'access-aisle': { component: AccessAisle, title: 'Access aisle width' },
	'aisle-marking': { component: AisleMarking, title: 'Access aisle markings' },
	'van-space': { component: VanSpace, title: 'Van-accessible space' },
	'vertical-clearance': { component: VerticalClearance, title: 'Van vertical clearance' },
	'sign-height': { component: SignHeight, title: 'Parking sign height' },
	dropoff: { component: Dropoff, title: 'Passenger drop-off' },
	curbside: { component: Curbside, title: 'Curbside voting' },
	'route-width': { component: RouteWidth, title: 'Route width' },
	slope: { component: Slope, title: 'Running slope' },
	'cross-slope': { component: CrossSlope, title: 'Cross slope' },
	'curb-ramp': { component: CurbRamp, title: 'Curb ramp' },
	'detectable-warning': { component: DetectableWarning, title: 'Detectable warning' },
	'level-change': { component: LevelChange, title: 'Change in level' },
	surface: { component: Surface, title: 'Ground surface' },
	grating: { component: Grating, title: 'Grates and openings' },
	'protruding-object': { component: ProtrudingObject, title: 'Protruding objects' },
	headroom: { component: Headroom, title: 'Headroom' },
	signage: { component: Signage, title: 'Directional signs' },
	ramp: { component: Ramp, title: 'Ramp' },
	handrail: { component: Handrail, title: 'Handrail height' },
	doorbell: { component: Doorbell, title: 'Doorbell for assistance' },
	'door-width': { component: DoorWidth, title: 'Door clear width' },
	threshold: { component: Threshold, title: 'Door threshold' },
	'door-hardware': { component: DoorHardware, title: 'Door hardware' },
	'door-force': { component: DoorForce, title: 'Door opening force' },
	'door-closer': { component: DoorCloser, title: 'Door closing speed' },
	'maneuvering-clearance': { component: ManeuveringClearance, title: 'Latch-side clearance' },
	vestibule: { component: Vestibule, title: 'Doors in a series' },
	elevator: { component: Elevator, title: 'Elevator' },
	'reach-range': { component: ReachRange, title: 'Reach range' },
	'turning-space': { component: TurningSpace, title: 'Turning space' },
	'table-height': { component: TableHeight, title: 'Table height and knee space' },
	'voting-station': { component: VotingStation, title: 'Accessible voting station' },
	'clear-floor-space': { component: ClearFloorSpace, title: 'Clear floor space' },
	seating: { component: Seating, title: 'Seating in line' },
	lighting: { component: Lighting, title: 'Lighting' }
};

/** True when `id` names a diagram in {@link diagrams}. */
export function hasDiagram(id: string | undefined): boolean {
	return id !== undefined && Object.hasOwn(diagrams, id);
}
