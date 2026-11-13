import { useState, type FormEvent } from 'react';
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { formatEventDateRange, getDeadlineStatus } from '../lib/formatters';
import type { CampusEvent, Registration } from '../types';
import { EventImage } from './EventImage';

interface EventDetailModalProps {
  event: CampusEvent;
  registration?: Registration;
  isSaved: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onToggleSave: (eventId: string) => void;
  onRegister: (payload: {
    eventId: string;
    track: string;
    teamName?: string;
    teammates?: string[];
    notes?: string;
    reminderEnabled: boolean;
  }) => Promise<void>;
  onCancelRegistration: (eventId: string) => Promise<void>;
  onOpenPass: (event: CampusEvent, registration: Registration) => void;
}

export function EventDetailModal({
  event,
  registration,
  isSaved,
  isSubmitting,
  onClose,
  onToggleSave,
  onRegister,
  onCancelRegistration,
  onOpenPass,
}: EventDetailModalProps) {
  const [selectedTrack, setSelectedTrack] = useState(event.tracks[0] || 'General Track');
  const [teamName, setTeamName] = useState('');
  const [teammatesRaw, setTeammatesRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const deadline = getDeadlineStatus(event.registrationDeadline);
  const fillPercent = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const isTeamEvent = event.teamSizeMax > 1;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (isTeamEvent && !teamName.trim()) {
      setErrorMsg('Please enter a team name to register for this team event.');
      return;
    }
    try {
      await onRegister({
        eventId: event.id,
        track: selectedTrack,
        teamName: isTeamEvent ? teamName.trim() : undefined,
        teammates: teammatesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: notes.trim() || undefined,
        reminderEnabled,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete registration.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <span className="font-semibold text-slate-800">{event.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{event.organizer}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(event.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isSaved
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-transparent hover:border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left 7 cols: Event Overview & Schedule */}
          <div className="lg:col-span-7 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <EventImage imageKey={event.imageKey} title={event.title} className="w-full h-full" />
            </div>

            <div>
              <h2
                id="modal-event-title"
                className="font-display text-2xl font-bold text-slate-900 text-balance"
              >
                {event.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{event.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-slate-800">Date & Time</div>
                  <div className="text-slate-600 mt-0.5">
                    {formatEventDateRange(event.startDate, event.endDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-slate-800">Location & Format</div>
                  <div className="text-slate-600 mt-0.5">
                    {event.venue} · {event.format}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-slate-800">Eligibility & Team</div>
                  <div className="text-slate-600 mt-0.5">
                    {event.eligibility} ·{' '}
                    {isTeamEvent
                      ? `${event.teamSizeMin}–${event.teamSizeMax} members`
                      : 'Individual entry'}
                  </div>
                </div>
              </div>

              {event.prizePool && (
                <div className="flex items-start gap-2.5">
                  <Trophy className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-semibold text-slate-800">Prize Pool</div>
                    <div className="font-mono tabular-nums text-slate-900 font-semibold mt-0.5">
                      {event.prizePool}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900 mb-3">
                Event Schedule
              </h3>
              <div className="space-y-2.5">
                {event.schedule.map((item, idx) => (
                  <div
                    key={`${item.time}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <div>
                      <span className="font-mono text-slate-500 mr-2.5 tabular-nums">
                        {item.time}
                      </span>
                      <span className="font-medium text-slate-900">{item.title}</span>
                    </div>
                    <span className="text-slate-500 shrink-0">{item.location}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900 mb-2">
                Participant Requirements
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                {event.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right 5 cols: Registration Status or Form */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Capacity</span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold">
                  {event.registeredCount} / {event.capacity} filled
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <div
                className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium tabular-nums ${
                  deadline.urgency === 'urgent' ? 'text-red-600' : 'text-slate-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {deadline.label}
              </div>
            </div>

            {registration ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    {registration.status}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {registration.ticketCode}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400">Selected Track:</span>{' '}
                    <span className="font-medium text-slate-800">{registration.track}</span>
                  </div>
                  {registration.teamName && (
                    <div>
                      <span className="text-slate-400">Team Name:</span>{' '}
                      <span className="font-medium text-slate-800">{registration.teamName}</span>
                    </div>
                  )}
                  {registration.teammates.length > 0 && (
                    <div>
                      <span className="text-slate-400">Teammates:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {registration.teammates.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => onOpenPass(event, registration)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <QrCode className="w-4 h-4" aria-hidden="true" />
                    Open Digital Pass
                  </button>

                  {!confirmCancel ? (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="w-full px-4 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel Registration
                    </button>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                      <p className="text-xs text-red-800 font-medium">
                        Confirm cancelling your seat?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancel(false)}
                          className="flex-1 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md"
                        >
                          Keep Spot
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onCancelRegistration(event.id)}
                          className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Complete Registration
                </h3>

                {errorMsg && (
                  <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reg-track"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Competition / Session Track
                  </label>
                  <select
                    id="reg-track"
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {event.tracks.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>

                {isTeamEvent && (
                  <>
                    <div>
                      <label
                        htmlFor="reg-team"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Team Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="reg-team"
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Kernel Collective"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reg-teammates"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Teammates (comma-separated emails or names)
                      </label>
                      <input
                        id="reg-teammates"
                        type="text"
                        value={teammatesRaw}
                        onChange={(e) => setTeammatesRaw(e.target.value)}
                        placeholder="aarav@campus.edu, maya@campus.edu"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="reg-notes"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Hardware or Accessibility Notes (optional)
                  </label>
                  <textarea
                    id="reg-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Requesting Jetson kit or power strip"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Notify me about room updates and start reminders
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Confirming...'
                    : event.registeredCount >= event.capacity
                    ? 'Join Priority Waitlist'
                    : 'Confirm Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
