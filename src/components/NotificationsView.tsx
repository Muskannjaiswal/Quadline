import { useMemo, useState } from 'react';
import { AlertCircle, Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';
import type {
  CampusEvent,
  EventCategory,
  EventNotification,
  NotificationType,
  StudentProfile,
} from '../types';

interface NotificationsViewProps {
  notifications: EventNotification[];
  events: CampusEvent[];
  profile: StudentProfile;
  onMarkRead: (id: string, read: boolean) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onSelectEvent: (event: CampusEvent) => void;
  onUpdateProfile: (updates: Partial<StudentProfile>) => void;
}

type FilterTab = 'All' | 'Unread' | NotificationType;

const ALL_INTERESTS: EventCategory[] = [
  'Hackathon',
  'Robotics',
  'Coding Contest',
  'Workshop',
  'Symposium',
  'Design Sprint',
  'Cultural & Club',
];

export function NotificationsView({
  notifications,
  events,
  profile,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onSelectEvent,
  onUpdateProfile,
}: NotificationsViewProps) {
  const [tab, setTab] = useState<FilterTab>('All');
  const [savedNotice, setSavedNotice] = useState(false);

  const eventMap = useMemo(() => {
    const map = new Map<string, CampusEvent>();
    events.forEach((e) => map.set(e.id, e));
    return map;
  }, [events]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    if (tab === 'All') return notifications;
    if (tab === 'Unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === tab);
  }, [notifications, tab]);

  const toggleInterest = (category: EventCategory) => {
    const exists = profile.interests.includes(category);
    const next = exists
      ? profile.interests.filter((c) => c !== category)
      : [...profile.interests, category];
    onUpdateProfile({ interests: next });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Notifications & Alert Preferences
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track registration confirmations, room changes, and closing deadlines tailored to your interests.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: Notification Feed */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['All', 'Unread', 'Deadline', 'Registration', 'Schedule Update', 'Recommendation'] as FilterTab[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    tab === item
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {item}
                  {item === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
              )
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                No notifications in this view
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                You are caught up on all alerts for this filter.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {filtered.map((notif) => {
                const linkedEvent = notif.eventId ? eventMap.get(notif.eventId) : undefined;
                return (
                  <div
                    key={notif.id}
                    className={`p-5 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50/35'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              notif.priority === 'Urgent'
                                ? 'text-red-600'
                                : !notif.read
                                ? 'text-blue-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {notif.priority === 'Urgent' && (
                              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            {notif.priority === 'Urgent' ? `Urgent · ${notif.type}` : notif.type}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="font-medium text-blue-700">Unread</span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900">
                          {notif.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {linkedEvent && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectEvent(linkedEvent);
                                if (!notif.read) onMarkRead(notif.id, true);
                              }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                              View {linkedEvent.title}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onMarkRead(notif.id, !notif.read)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            {notif.read ? 'Mark unread' : 'Mark read'}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteNotification(notif.id)}
                        aria-label="Dismiss notification"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 cols: Personalized Alert & Interest Settings */}
        <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Personalization & Alerts
            </h2>
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-700">Saved</span>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Preferred Event Categories
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Select topics to receive prioritized event recommendations and deadline reminders.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((cat) => {
                const active = profile.interests.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleInterest(cat)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label
                htmlFor="reminder-lead"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Default Deadline Reminder
              </label>
              <select
                id="reminder-lead"
                value={profile.reminderHoursBefore}
                onChange={(e) => {
                  onUpdateProfile({ reminderHoursBefore: Number(e.target.value) });
                  setSavedNotice(true);
                  window.setTimeout(() => setSavedNotice(false), 1800);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value={2}>2 hours before event / deadline</option>
                <option value={24}>24 hours before event / deadline</option>
                <option value={48}>48 hours before event / deadline</option>
              </select>
            </div>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Weekly Campus Digest
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Send Monday summary to {profile.email}
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.emailDigest}
                onChange={(e) => {
                  onUpdateProfile({ emailDigest: e.target.checked });
                  setSavedNotice(true);
                  window.setTimeout(() => setSavedNotice(false), 1800);
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}
