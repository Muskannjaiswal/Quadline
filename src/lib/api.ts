import type {
  CampusEvent,
  EventNotification,
  PortalState,
  Registration,
  StudentProfile,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  bootstrap: () => request<PortalState>('/api/bootstrap'),

  register: (payload: {
    eventId: string;
    track: string;
    teamName?: string;
    teammates?: string[];
    notes?: string;
    reminderEnabled?: boolean;
  }) =>
    request<{ registration: Registration; event: CampusEvent; notification: EventNotification }>(
      '/api/registrations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  updateRegistration: (
    eventId: string,
    updates: Partial<Pick<Registration, 'reminderEnabled' | 'track' | 'teamName' | 'teammates' | 'notes'>>
  ) =>
    request<{ registration: Registration }>(`/api/registrations/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  cancelRegistration: (eventId: string) =>
    request<{ removedId: string; event?: CampusEvent; notification?: EventNotification }>(
      `/api/registrations/${eventId}`,
      { method: 'DELETE' }
    ),

  toggleSaved: (eventId: string) =>
    request<{ savedEventIds: string[]; saved: boolean }>(`/api/saved/${eventId}`, {
      method: 'POST',
    }),

  markNotificationRead: (id: string, read = true) =>
    request<{ notification: EventNotification }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    }),

  markAllNotificationsRead: () =>
    request<{ notifications: EventNotification[] }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  deleteNotification: (id: string) =>
    request<{ ok: boolean }>(`/api/notifications/${id}`, {
      method: 'DELETE',
    }),

  createEvent: (
    payload: Omit<CampusEvent, 'id' | 'registeredCount' | 'featured' | 'schedule' | 'requirements'> & {
      schedule?: CampusEvent['schedule'];
      requirements?: string[];
    }
  ) =>
    request<{ event: CampusEvent; notification?: EventNotification }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProfile: (updates: Partial<StudentProfile>) =>
    request<{ profile: StudentProfile }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
};
