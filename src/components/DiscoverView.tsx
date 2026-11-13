import { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, CheckCircle2, Search, SlidersHorizontal, Trophy } from 'lucide-react';
import { formatEventDateRange, getDeadlineStatus } from '../lib/formatters';
import type { CampusEvent, EventCategory, EventFormat, Registration } from '../types';
import { EventCard } from './EventCard';
import { EventImage } from './EventImage';

interface DiscoverViewProps {
  events: CampusEvent[];
  registrations: Registration[];
  savedEventIds: string[];
  interests: EventCategory[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectEvent: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onToggleSave: (eventId: string) => void;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Hackathon',
  'Robotics',
  'Coding Contest',
  'Workshop',
  'Symposium',
  'Design Sprint',
];

type SortOption = 'upcoming' | 'deadline' | 'popular' | 'prize';

export function DiscoverView({
  events,
  registrations,
  savedEventIds,
  interests,
  searchQuery,
  onSearchChange,
  onSelectEvent,
  onQuickRegister,
  onToggleSave,
}: DiscoverViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [selectedFormat, setSelectedFormat] = useState<'All' | EventFormat>('All');
  const [competitionsOnly, setCompetitionsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('upcoming');

  const regByEventId = useMemo(() => {
    const map = new Map<string, Registration>();
    registrations.forEach((r) => map.set(r.eventId, r));
    return map;
  }, [registrations]);

  const featuredEvent = useMemo(
    () => events.find((e) => e.featured) || events[0],
    [events]
  );

  const recommendedEvents = useMemo(() => {
    return events
      .filter((e) => e.id !== featuredEvent?.id && interests.includes(e.category))
      .slice(0, 3);
  }, [events, featuredEvent, interests]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = events.filter((event) => {
      if (selectedCategory !== 'All' && event.category !== selectedCategory) return false;
      if (selectedFormat !== 'All' && event.format !== selectedFormat) return false;
      if (competitionsOnly && !event.isCompetition) return false;
      if (q) {
        const haystack = `${event.title} ${event.subtitle} ${event.organizer} ${event.venue} ${event.category} ${event.tracks.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'upcoming') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      if (sortBy === 'deadline') {
        return new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime();
      }
      if (sortBy === 'popular') {
        return b.registeredCount / b.capacity - a.registeredCount / a.capacity;
      }
      return (b.prizeValue || 0) - (a.prizeValue || 0);
    });
  }, [events, selectedCategory, selectedFormat, competitionsOnly, searchQuery, sortBy]);

  const featuredReg = featuredEvent ? regByEventId.get(featuredEvent.id) : undefined;
  const featuredDeadline = featuredEvent
    ? getDeadlineStatus(featuredEvent.registrationDeadline)
    : null;

  return (
    <div className="space-y-10">
      {/* Featured Spotlight Split */}
      {featuredEvent && !searchQuery && selectedCategory === 'All' && !competitionsOnly && (
        <section aria-label="Featured event spotlight">
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl overflow-hidden items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">Featured Competition</span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredEvent.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatEventDateRange(featuredEvent.startDate, featuredEvent.endDate)}</span>
                </div>

                <h1 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                  {featuredEvent.title}
                </h1>

                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  {featuredEvent.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-slate-500">Prize Pool</div>
                    <div className="mt-0.5 font-mono tabular-nums text-base font-semibold text-slate-900">
                      {featuredEvent.prizePool || 'Certificate'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Registered</div>
                    <div className="mt-0.5 font-mono tabular-nums text-base font-semibold text-slate-900">
                      {featuredEvent.registeredCount} / {featuredEvent.capacity}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Team Size</div>
                    <div className="mt-0.5 font-mono tabular-nums text-base font-semibold text-slate-900">
                      {featuredEvent.teamSizeMin}–{featuredEvent.teamSizeMax} members
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Registration</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums">
                      {featuredDeadline?.label}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {featuredReg ? (
                    <button
                      type="button"
                      onClick={() => onSelectEvent(featuredEvent)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      Registered · {featuredReg.ticketCode}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuickRegister(featuredEvent)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                    >
                      Register for QuadHack
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectEvent(featuredEvent)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                  >
                    View Tracks & Schedule
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSave(featuredEvent.id)}
                    aria-pressed={savedEventIds.includes(featuredEvent.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      savedEventIds.includes(featuredEvent.id)
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        savedEventIds.includes(featuredEvent.id) ? 'fill-current' : ''
                      }`}
                    />
                    {savedEventIds.includes(featuredEvent.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 min-h-[240px] lg:min-h-full relative bg-slate-100">
              <EventImage
                imageKey={featuredEvent.imageKey}
                title={featuredEvent.title}
                className="w-full h-full lg:absolute lg:inset-0"
              />
            </div>
          </div>
        </section>
      )}

      {/* Personalized recommendations strip */}
      {recommendedEvents.length > 0 && !searchQuery && selectedCategory === 'All' && !competitionsOnly && (
        <section aria-labelledby="recommended-heading">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <h2 id="recommended-heading" className="font-display text-lg font-semibold text-slate-900">
                Matched to your interests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Based on {interests.join(' · ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedEvents.map((event) => {
              const reg = regByEventId.get(event.id);
              const deadline = getDeadlineStatus(event.registrationDeadline);
              return (
                <div
                  key={event.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{event.category}</span>
                      {event.prizePool && (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-900 font-medium">
                          <Trophy className="w-3 h-3 text-amber-600" aria-hidden="true" />
                          {event.prizePool}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className="mt-1.5 text-left font-display font-semibold text-base text-slate-900 hover:text-blue-700 transition-colors line-clamp-1"
                    >
                      {event.title}
                    </button>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                      {formatEventDateRange(event.startDate, event.endDate)} · {event.venue}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        deadline.urgency === 'urgent' ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {deadline.label}
                    </span>
                    {reg ? (
                      <button
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0"
                      >
                        Registered ({reg.ticketCode})
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onQuickRegister(event)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap shrink-0"
                      >
                        Quick Register
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter & Exploration Directory */}
      <section aria-labelledby="all-events-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 id="all-events-heading" className="font-display text-xl font-bold text-slate-900">
              Upcoming Campus Events
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 tabular-nums">
              Showing {filteredEvents.length} of {events.length} scheduled events and competitions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCompetitionsOnly((v) => !v)}
              aria-pressed={competitionsOnly}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                competitionsOnly
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              Competitions Only
            </button>

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="sr-only">Format</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as 'All' | EventFormat)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              >
                <option value="All">All Formats</option>
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Online">Online</option>
              </select>
            </label>

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              >
                <option value="upcoming">Soonest Date</option>
                <option value="deadline">Closing Soon</option>
                <option value="popular">Most Popular</option>
                <option value="prize">Highest Prize Pool</option>
              </select>
            </label>
          </div>
        </div>

        {/* Category segmented buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              No matching events found
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Try clearing your search query or switching back to all event categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedFormat('All');
                setCompetitionsOnly(false);
                onSearchChange('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registration={regByEventId.get(event.id)}
                isSaved={savedEventIds.includes(event.id)}
                onSelect={onSelectEvent}
                onQuickRegister={onQuickRegister}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
