import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  BellOff,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Trash2,
} from 'lucide-react';
import {
  formatEventDateRange,
  formatRelativeTime,
  getDeadlineStatus,
} from '../lib/formatters';
import type {
  CampusEvent,
  EventNotification,
  Registration,
  StudentProfile,
} from '../types';

interface DashboardViewProps {
  profile: StudentProfile;
  events: CampusEvent[];
  registrations: Registration[];
  notifications: EventNotification[];
  savedEventIds: string[];
  onSelectEvent: (event: CampusEvent) => void;
  onOpenPass: (event: CampusEvent, registration: Registration) => void;
  onToggleReminder: (eventId: string, enabled: boolean) => void;
  onCancelRegistration: (eventId: string) => void;
  onToggleSave: (eventId: string) => void;
  onNavigateNotifications: () => void;
  onNavigateDiscover: () => void;
  onMarkNotificationRead: (id: string) => void;
}

export function DashboardView({
  profile,
  events,
  registrations,
  notifications,
  savedEventIds,
  onSelectEvent,
  onOpenPass,
  onToggleReminder,
  onCancelRegistration,
  onToggleSave,
  onNavigateNotifications,
  onNavigateDiscover,
  onMarkNotificationRead,
}: DashboardViewProps) {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const eventMap = useMemo(() => {
    const map = new Map<string, CampusEvent>();
    events.forEach((e) => map.set(e.id, e));
    return map;
  }, [events]);

  const registeredEntries = useMemo(() => {
    return registrations
      .map((reg) => ({
        registration: reg,
        event: eventMap.get(reg.eventId),
      }))
      .filter((item): item is { registration: Registration; event: CampusEvent } => Boolean(item.event))
      .sort(
        (a, b) =>
          new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime()
      );
  }, [registrations, eventMap]);

  const savedEvents = useMemo(() => {
    return savedEventIds
      .map((id) => eventMap.get(id))
      .filter((e): e is CampusEvent => Boolean(e));
  }, [savedEventIds, eventMap]);

  const upcomingThisWeekCount = useMemo(() => {
    const now = Date.now();
    const weekLater = now + 7 * 24 * 60 * 60 * 1000;
    return registeredEntries.filter(({ event }) => {
      const t = new Date(event.startDate).getTime();
      return t >= now && t <= weekLater;
    }).length;
  }, [registeredEntries]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {profile.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {profile.department} · {profile.year} · Student ID{' '}
            <span className="font-mono text-slate-800">{profile.studentId}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateDiscover}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Browse More Events
        </button>
      </div>

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Active Registrations</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-slate-900">
            {registeredEntries.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Upcoming Within 7 Days</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-blue-700">
            {upcomingThisWeekCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Saved Bookmarks</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-slate-900">
            {savedEvents.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Unread Notifications</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-amber-700">
            {unreadCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: Registered Events */}
        <section className="xl:col-span-8 space-y-4" aria-labelledby="my-registrations-heading">
          <div className="flex items-center justify-between">
            <h2 id="my-registrations-heading" className="font-display text-lg font-semibold text-slate-900">
              Your Registrations & Passes
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {registeredEntries.length} active
            </span>
          </div>

          {registeredEntries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                No event registrations yet
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Explore upcoming hackathons, workshops, and robotics trials to reserve your seat and generate a digital pass.
              </p>
              <button
                type="button"
                onClick={onNavigateDiscover}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explore Events
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {registeredEntries.map(({ registration, event }) => {
                const isConfirming = confirmCancelId === event.id;
                return (
                  <div key={registration.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              registration.status === 'Confirmed'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            {registration.status}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-700 font-medium">
                            Pass {registration.ticketCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{event.category}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectEvent(event)}
                          className="mt-1.5 text-left font-display text-lg font-semibold text-slate-900 hover:text-blue-700 transition-colors"
                        >
                          {event.title}
                        </button>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {formatEventDateRange(event.startDate, event.endDate)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {event.venue}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-500">
                          Track: <span className="font-medium text-slate-700">{registration.track}</span>
                          {registration.teamName && (
                            <>
                              {' '}
                              · Team: <span className="font-medium text-slate-700">{registration.teamName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenPass(event, registration)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                          View Pass
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onToggleReminder(event.id, !registration.reminderEnabled)
                          }
                          aria-pressed={registration.reminderEnabled}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                            registration.reminderEnabled
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {registration.reminderEnabled ? (
                            <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          {registration.reminderEnabled ? 'Alerts On' : 'Alerts Off'}
                        </button>

                        {!isConfirming ? (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(event.id)}
                            aria-label={`Cancel registration for ${event.title}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isConfirming && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-red-50/60 px-3 py-2.5 rounded-lg">
                        <span className="text-xs font-medium text-red-800">
                          Release your seat ({registration.ticketCode}) for {event.title}?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                          >
                            Keep Spot
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onCancelRegistration(event.id);
                              setConfirmCancelId(null);
                            }}
                            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
                          >
                            Confirm Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 4 cols: Recent Notifications & Saved Events */}
        <aside className="xl:col-span-4 space-y-6">
          {/* Recent Notifications */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Recent Alerts
              </h2>
              <button
                type="button"
                onClick={onNavigateNotifications}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50/40'}`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        notif.priority === 'Urgent' ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {notif.priority === 'Urgent' && (
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {notif.type}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900 leading-snug">
                    {notif.title}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {notif.eventId && eventMap.has(notif.eventId) && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = eventMap.get(notif.eventId!);
                          if (target) onSelectEvent(target);
                          if (!notif.read) onMarkNotificationRead(notif.id);
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Open event
                      </button>
                    )}
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No recent notifications.
                </div>
              )}
            </div>
          </div>

          {/* Saved Events & Deadlines */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Saved Bookmarks
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {savedEvents.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {savedEvents.map((ev) => {
                const dl = getDeadlineStatus(ev.registrationDeadline);
                return (
                  <div key={ev.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectEvent(ev)}
                        className="text-left text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1"
                      >
                        {ev.title}
                      </button>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                            dl.urgency === 'urgent' ? 'text-red-600' : 'text-slate-500'
                          }`}
                        >
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {dl.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSave(ev.id)}
                      aria-label={`Remove ${ev.title} bookmark`}
                      className="p-1.5 text-blue-600 hover:text-slate-600 rounded-md"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                );
              })}
              {savedEvents.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  Bookmark upcoming competitions to track their registration deadlines here.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
