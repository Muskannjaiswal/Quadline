import { Bookmark, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { formatEventDateRange, getDeadlineStatus } from '../lib/formatters';
import type { CampusEvent, Registration } from '../types';
import { EventImage } from './EventImage';

interface EventCardProps {
  event: CampusEvent;
  registration?: Registration;
  isSaved: boolean;
  onSelect: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onToggleSave: (eventId: string) => void;
}

export function EventCard({
  event,
  registration,
  isSaved,
  onSelect,
  onQuickRegister,
  onToggleSave,
}: EventCardProps) {
  const deadline = getDeadlineStatus(event.registrationDeadline);
  const spotsLeft = Math.max(0, event.capacity - event.registeredCount);

  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors duration-150 hover:border-slate-300">
      <button
        type="button"
        onClick={() => onSelect(event)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <EventImage
          imageKey={event.imageKey}
          title={event.title}
          className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
      </button>

      <div className="flex flex-col flex-1 p-5">
        {/* Clean unboxed 1-line metadata kicker */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
          <span className="font-medium text-slate-700">{event.category}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{event.format}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{event.venue}</span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(event)}
          className="mt-2 text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
        >
          <h3 className="font-display text-lg font-semibold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
            {event.title}
          </h3>
        </button>

        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">
          {event.subtitle}
        </p>

        <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-slate-600">
            <span className="truncate">{formatEventDateRange(event.startDate, event.endDate)}</span>
            {event.prizePool && (
              <span className="inline-flex items-center gap-1 font-mono tabular-nums font-medium text-slate-900 shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                {event.prizePool}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                deadline.urgency === 'urgent'
                  ? 'text-red-600'
                  : deadline.urgency === 'soon'
                  ? 'text-amber-700'
                  : 'text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {deadline.label}
            </span>

            <span className="font-mono tabular-nums text-slate-500 shrink-0">
              {spotsLeft > 0 ? `${spotsLeft} seats left` : 'Waitlist open'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {registration ? (
            <button
              type="button"
              onClick={() => onSelect(event)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              {registration.status} · {registration.ticketCode}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQuickRegister(event)}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              {spotsLeft === 0 ? 'Join Waitlist' : 'Register'}
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleSave(event.id)}
              aria-label={isSaved ? `Remove ${event.title} from saved events` : `Save ${event.title}`}
              aria-pressed={isSaved}
              className={`p-2 rounded-lg border transition-colors ${
                isSaved
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onSelect(event)}
              className="px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
