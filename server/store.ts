import fs from 'fs';
import path from 'path';
import type {
  CampusEvent,
  EventNotification,
  PortalState,
  Registration,
  StudentProfile,
} from '../src/types';
import { INITIAL_PORTAL_STATE } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'quadline-store.json');

function ensureStoreFile(): PortalState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_PORTAL_STATE, null, 2), 'utf-8');
    return structuredClone(INITIAL_PORTAL_STATE);
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PortalState;
    if (!parsed || !Array.isArray(parsed.events)) {
      throw new Error('Invalid store structure');
    }
    return parsed;
  } catch {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_PORTAL_STATE, null, 2), 'utf-8');
    return structuredClone(INITIAL_PORTAL_STATE);
  }
}

let state: PortalState = ensureStoreFile();

function persist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export function getPortalState(): PortalState {
  return state;
}

export function registerForEvent(payload: {
  eventId: string;
  track: string;
  teamName?: string;
  teammates?: string[];
  notes?: string;
  reminderEnabled?: boolean;
}): { registration: Registration; event: CampusEvent; notification: EventNotification } {
  const event = state.events.find((e) => e.id === payload.eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const existing = state.registrations.find((r) => r.eventId === payload.eventId);
  if (existing) {
    throw new Error('Already registered for this event');
  }

  const isWaitlisted = event.registeredCount >= event.capacity;
  const ticketNum = Math.floor(1000 + Math.random() * 9000);
  const registration: Registration = {
    id: `reg-${Date.now()}`,
    eventId: event.id,
    ticketCode: `QL-${ticketNum}`,
    status: isWaitlisted ? 'Waitlisted' : 'Confirmed',
    registeredAt: new Date().toISOString(),
    track: payload.track || event.tracks[0] || 'General Track',
    teamName: payload.teamName?.trim() || undefined,
    teammates: (payload.teammates || []).map((t) => t.trim()).filter(Boolean),
    notes: payload.notes?.trim() || undefined,
    reminderEnabled: payload.reminderEnabled ?? true,
  };

  if (!isWaitlisted) {
    event.registeredCount += 1;
  }
  state.registrations.unshift(registration);

  const notification: EventNotification = {
    id: `notif-${Date.now()}`,
    eventId: event.id,
    type: 'Registration',
    title: isWaitlisted
      ? `Waitlisted for ${event.title}`
      : `Registration confirmed: ${event.title}`,
    message: isWaitlisted
      ? `Capacity reached (${event.capacity}/${event.capacity}). You are on the priority waitlist with reference ${registration.ticketCode}.`
      : `Pass ${registration.ticketCode} issued for ${registration.track} at ${event.venue}.`,
    createdAt: new Date().toISOString(),
    read: false,
    priority: 'Normal',
  };

  state.notifications.unshift(notification);
  persist();
  return { registration, event, notification };
}

export function updateRegistration(
  eventId: string,
  updates: Partial<Pick<Registration, 'reminderEnabled' | 'track' | 'teamName' | 'teammates' | 'notes'>>
): Registration {
  const reg = state.registrations.find((r) => r.eventId === eventId);
  if (!reg) {
    throw new Error('Registration not found');
  }
  if (typeof updates.reminderEnabled === 'boolean') reg.reminderEnabled = updates.reminderEnabled;
  if (typeof updates.track === 'string' && updates.track.trim()) reg.track = updates.track.trim();
  if (updates.teamName !== undefined) reg.teamName = updates.teamName.trim() || undefined;
  if (Array.isArray(updates.teammates)) reg.teammates = updates.teammates.filter(Boolean);
  if (updates.notes !== undefined) reg.notes = updates.notes.trim() || undefined;
  persist();
  return reg;
}

export function cancelRegistration(eventId: string): {
  removedId: string;
  event?: CampusEvent;
  notification?: EventNotification;
} {
  const index = state.registrations.findIndex((r) => r.eventId === eventId);
  if (index === -1) {
    throw new Error('Registration not found');
  }

  const [removed] = state.registrations.splice(index, 1);
  const event = state.events.find((e) => e.id === eventId);
  if (event && removed.status === 'Confirmed' && event.registeredCount > 0) {
    event.registeredCount -= 1;
  }

  let notification: EventNotification | undefined;
  if (event) {
    notification = {
      id: `notif-${Date.now()}`,
      eventId: event.id,
      type: 'Registration',
      title: `Cancelled registration for ${event.title}`,
      message: `Pass ${removed.ticketCode} has been released back to the student pool.`,
      createdAt: new Date().toISOString(),
      read: false,
      priority: 'Normal',
    };
    state.notifications.unshift(notification);
  }

  persist();
  return { removedId: removed.id, event, notification };
}

export function toggleSavedEvent(eventId: string): { savedEventIds: string[]; saved: boolean } {
  const exists = state.savedEventIds.includes(eventId);
  if (exists) {
    state.savedEventIds = state.savedEventIds.filter((id) => id !== eventId);
  } else {
    state.savedEventIds.unshift(eventId);
  }
  persist();
  return { savedEventIds: state.savedEventIds, saved: !exists };
}

export function markNotificationRead(id: string, read = true): EventNotification {
  const notif = state.notifications.find((n) => n.id === id);
  if (!notif) {
    throw new Error('Notification not found');
  }
  notif.read = read;
  persist();
  return notif;
}

export function markAllNotificationsRead(): EventNotification[] {
  state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
  persist();
  return state.notifications;
}

export function deleteNotification(id: string): void {
  state.notifications = state.notifications.filter((n) => n.id !== id);
  persist();
}

export function createEvent(
  input: Omit<CampusEvent, 'id' | 'registeredCount' | 'featured' | 'schedule' | 'requirements'> & {
    schedule?: CampusEvent['schedule'];
    requirements?: string[];
  }
): { event: CampusEvent; notification?: EventNotification } {
  const newEvent: CampusEvent = {
    ...input,
    id: `evt-${Date.now()}`,
    registeredCount: 1,
    featured: false,
    schedule:
      input.schedule && input.schedule.length > 0
        ? input.schedule
        : [{ time: 'Opening Session', title: 'Check-in & Orientation', location: input.venue }],
    requirements:
      input.requirements && input.requirements.length > 0
        ? input.requirements
        : ['Valid university student ID required'],
  };

  state.events.unshift(newEvent);

  let notification: EventNotification | undefined;
  if (state.profile.interests.includes(newEvent.category) || newEvent.isCompetition) {
    notification = {
      id: `notif-${Date.now()}`,
      eventId: newEvent.id,
      type: newEvent.isCompetition ? 'Competition Alert' : 'Recommendation',
      title: `New ${newEvent.category}: ${newEvent.title}`,
      message: `Published by ${newEvent.organizer} at ${newEvent.venue}. Registration is now open.`,
      createdAt: new Date().toISOString(),
      read: false,
      priority: 'Normal',
    };
    state.notifications.unshift(notification);
  }

  persist();
  return { event: newEvent, notification };
}

export function updateProfile(updates: Partial<StudentProfile>): StudentProfile {
  state.profile = {
    ...state.profile,
    ...updates,
    interests: Array.isArray(updates.interests) ? updates.interests : state.profile.interests,
  };
  persist();
  return state.profile;
}
