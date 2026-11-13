import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  Compass,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import { CalendarView } from './components/CalendarView';
import { CompetitionsView } from './components/CompetitionsView';
import { DashboardView } from './components/DashboardView';
import { DigitalPassModal } from './components/DigitalPassModal';
import { DiscoverView } from './components/DiscoverView';
import { EventDetailModal } from './components/EventDetailModal';
import { NotificationsView } from './components/NotificationsView';
import { SubmitEventModal } from './components/SubmitEventModal';
import { api } from './lib/api';
import { STUDENT_AVATAR } from './lib/eventMedia';
import { formatRelativeTime } from './lib/formatters';
import type {
  CampusEvent,
  PortalState,
  Registration,
  StudentProfile,
} from './types';

type ActiveTab = 'discover' | 'competitions' | 'dashboard' | 'notifications' | 'calendar';

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof Compass }[] = [
  { id: 'discover', label: 'Discover Events', icon: Compass },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'calendar', label: 'Campus Calendar', icon: Calendar },
];

export default function App() {
  const [state, setState] = useState<PortalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [passModalData, setPassModalData] = useState<{
    event: CampusEvent;
    registration: Registration;
  } | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3400);
  }, []);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.bootstrap();
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load campus events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const unreadCount = useMemo(
    () => (state ? state.notifications.filter((n) => !n.read).length : 0),
    [state]
  );

  const regByEventId = useMemo(() => {
    const map = new Map<string, Registration>();
    state?.registrations.forEach((r) => map.set(r.eventId, r));
    return map;
  }, [state]);

  const activeNavLabel =
    NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Discover Events';

  const handleToggleSave = async (eventId: string) => {
    if (!state) return;
    try {
      const res = await api.toggleSaved(eventId);
      setState((prev) => (prev ? { ...prev, savedEventIds: res.savedEventIds } : prev));
      showToast(res.saved ? 'Saved to your bookmarks.' : 'Removed from bookmarks.');
    } catch {
      showToast('Could not update bookmark.');
    }
  };

  const handleRegister = async (payload: {
    eventId: string;
    track: string;
    teamName?: string;
    teammates?: string[];
    notes?: string;
    reminderEnabled: boolean;
  }) => {
    setIsMutating(true);
    try {
      const res = await api.register(payload);
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          registrations: [res.registration, ...prev.registrations],
          events: prev.events.map((e) => (e.id === res.event.id ? res.event : e)),
          notifications: [res.notification, ...prev.notifications],
        };
      });
      setSelectedEvent(res.event);
      showToast(`Confirmed ${res.registration.ticketCode} for ${res.event.title}.`);
    } finally {
      setIsMutating(false);
    }
  };

  const handleQuickRegister = (event: CampusEvent) => {
    setSelectedEvent(event);
  };

  const handleCancelRegistration = async (eventId: string) => {
    setIsMutating(true);
    try {
      const res = await api.cancelRegistration(eventId);
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          registrations: prev.registrations.filter((r) => r.eventId !== eventId),
          events: res.event
            ? prev.events.map((e) => (e.id === res.event!.id ? res.event! : e))
            : prev.events,
          notifications: res.notification
            ? [res.notification, ...prev.notifications]
            : prev.notifications,
        };
      });
      if (res.event && selectedEvent?.id === res.event.id) {
        setSelectedEvent(res.event);
      }
      showToast('Registration cancelled and seat released.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleReminder = async (eventId: string, enabled: boolean) => {
    try {
      const res = await api.updateRegistration(eventId, { reminderEnabled: enabled });
      setState((prev) =>
        prev
          ? {
              ...prev,
              registrations: prev.registrations.map((r) =>
                r.eventId === eventId ? res.registration : r
              ),
            }
          : prev
      );
      showToast(enabled ? 'Event reminders enabled.' : 'Event reminders muted.');
    } catch {
      showToast('Failed to update reminder preference.');
    }
  };

  const handleMarkNotificationRead = async (id: string, read = true) => {
    try {
      const res = await api.markNotificationRead(id, read);
      setState((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === id ? res.notification : n
              ),
            }
          : prev
      );
    } catch {
      // Ignore transient error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      setState((prev) => (prev ? { ...prev, notifications: res.notifications } : prev));
      showToast('All notifications marked as read.');
    } catch {
      showToast('Could not mark notifications read.');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setState((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.filter((n) => n.id !== id),
            }
          : prev
      );
    } catch {
      showToast('Could not dismiss notification.');
    }
  };

  const handleCreateEvent = async (
    payload: Omit<CampusEvent, 'id' | 'registeredCount' | 'featured' | 'schedule' | 'requirements'>
  ) => {
    const res = await api.createEvent(payload);
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: [res.event, ...prev.events],
        notifications: res.notification
          ? [res.notification, ...prev.notifications]
          : prev.notifications,
      };
    });
    showToast(`Published "${res.event.title}" to the campus directory.`);
  };

  const handleUpdateProfile = async (updates: Partial<StudentProfile>) => {
    try {
      const res = await api.updateProfile(updates);
      setState((prev) => (prev ? { ...prev, profile: res.profile } : prev));
    } catch {
      showToast('Could not save preferences.');
    }
  };

  const navigateTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setNotifPopoverOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => navigateTo('discover')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
          >
            Quadline
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const count =
              item.id === 'dashboard'
                ? state?.registrations.length
                : item.id === 'notifications'
                ? unreadCount
                : undefined;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`font-mono tabular-nums text-xs font-semibold ${
                      active ? 'text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Student Profile Summary */}
        {state && (
          <div className="p-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              {avatarFailed ? (
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  MJ
                </div>
              ) : (
                <img
                  src={STUDENT_AVATAR}
                  alt={state.profile.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {state.profile.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {state.profile.year}
                </div>
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="font-display text-xl font-bold text-slate-900">Quadline</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">Quadline</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden md:block w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'discover') setActiveTab('discover');
                }}
                placeholder="Search events, labs, tracks..."
                aria-label="Search campus events"
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Notification Popover Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifPopoverOpen((v) => !v)}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={notifPopoverOpen}
                className="relative p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white font-mono text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifPopoverOpen && state && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-slate-900">
                      Notifications
                    </span>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigateTo('notifications')}
                        className="text-xs font-medium text-slate-500 hover:text-slate-900"
                      >
                        See all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {state.notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (!n.read) handleMarkNotificationRead(n.id, true);
                          const ev = n.eventId
                            ? state.events.find((e) => e.id === n.eventId)
                            : undefined;
                          if (ev) {
                            setSelectedEvent(ev);
                            setNotifPopoverOpen(false);
                          } else {
                            navigateTo('notifications');
                          }
                        }}
                        className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors ${
                          n.read ? 'bg-white' : 'bg-blue-50/35'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">{n.type}</span>
                          <span className="tabular-nums">{formatRelativeTime(n.createdAt)}</span>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-900 line-clamp-2">
                          {n.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Submit Event
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 py-8">
          {loading ? (
            <div className="space-y-6" aria-label="Loading events">
              <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : error || !state ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Could not connect to campus events directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">{error || 'Please try again.'}</p>
              <button
                type="button"
                onClick={loadBootstrap}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'discover' && (
                <DiscoverView
                  events={state.events}
                  registrations={state.registrations}
                  savedEventIds={state.savedEventIds}
                  interests={state.profile.interests}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectEvent={setSelectedEvent}
                  onQuickRegister={handleQuickRegister}
                  onToggleSave={handleToggleSave}
                />
              )}

              {activeTab === 'competitions' && (
                <CompetitionsView
                  events={state.events}
                  registrations={state.registrations}
                  savedEventIds={state.savedEventIds}
                  onSelectEvent={setSelectedEvent}
                  onQuickRegister={handleQuickRegister}
                  onToggleSave={handleToggleSave}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  profile={state.profile}
                  events={state.events}
                  registrations={state.registrations}
                  notifications={state.notifications}
                  savedEventIds={state.savedEventIds}
                  onSelectEvent={setSelectedEvent}
                  onOpenPass={(event, registration) =>
                    setPassModalData({ event, registration })
                  }
                  onToggleReminder={handleToggleReminder}
                  onCancelRegistration={handleCancelRegistration}
                  onToggleSave={handleToggleSave}
                  onNavigateNotifications={() => navigateTo('notifications')}
                  onNavigateDiscover={() => navigateTo('discover')}
                  onMarkNotificationRead={(id) => handleMarkNotificationRead(id, true)}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView
                  notifications={state.notifications}
                  events={state.events}
                  profile={state.profile}
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllRead}
                  onDeleteNotification={handleDeleteNotification}
                  onSelectEvent={setSelectedEvent}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  events={state.events}
                  registrations={state.registrations}
                  savedEventIds={state.savedEventIds}
                  onSelectEvent={setSelectedEvent}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Event Detail & Registration Modal */}
      {selectedEvent && state && (
        <EventDetailModal
          event={selectedEvent}
          registration={regByEventId.get(selectedEvent.id)}
          isSaved={state.savedEventIds.includes(selectedEvent.id)}
          isSubmitting={isMutating}
          onClose={() => setSelectedEvent(null)}
          onToggleSave={handleToggleSave}
          onRegister={handleRegister}
          onCancelRegistration={handleCancelRegistration}
          onOpenPass={(event, registration) => {
            setSelectedEvent(null);
            setPassModalData({ event, registration });
          }}
        />
      )}

      {/* Digital Event Pass Modal */}
      {passModalData && state && (
        <DigitalPassModal
          event={passModalData.event}
          registration={passModalData.registration}
          profile={state.profile}
          onClose={() => setPassModalData(null)}
        />
      )}

      {/* Publish Campus Event Modal */}
      {submitModalOpen && (
        <SubmitEventModal
          onClose={() => setSubmitModalOpen(false)}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {/* Non-intrusive action confirmation toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
