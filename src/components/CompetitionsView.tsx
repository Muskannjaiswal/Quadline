import { useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, Clock, Trophy, Users } from 'lucide-react';
import { formatShortDate, getDeadlineStatus } from '../lib/formatters';
import type { CampusEvent, EventCategory, Registration } from '../types';

interface CompetitionsViewProps {
  events: CampusEvent[];
  registrations: Registration[];
  savedEventIds: string[];
  onSelectEvent: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onToggleSave: (eventId: string) => void;
}

const COMP_FILTERS: ('All' | EventCategory)[] = [
  'All',
  'Hackathon',
  'Robotics',
  'Coding Contest',
  'Design Sprint',
];

export function CompetitionsView({
  events,
  registrations,
  savedEventIds,
  onSelectEvent,
  onQuickRegister,
  onToggleSave,
}: CompetitionsViewProps) {
  const [discipline, setDiscipline] = useState<'All' | EventCategory>('All');

  const regByEventId = useMemo(() => {
    const map = new Map<string, Registration>();
    registrations.forEach((r) => map.set(r.eventId, r));
    return map;
  }, [registrations]);

  const competitions = useMemo(() => {
    return events
      .filter((e) => e.isCompetition)
      .filter((e) => discipline === 'All' || e.category === discipline)
      .sort(
        (a, b) =>
          new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime()
      );
  }, [events, discipline]);

  const allCompetitions = useMemo(() => events.filter((e) => e.isCompetition), [events]);

  const totalPrizeValue = useMemo(
    () => allCompetitions.reduce((sum, e) => sum + (e.prizeValue || 0), 0),
    [allCompetitions]
  );

  const closingSoonCount = useMemo(
    () =>
      allCompetitions.filter((e) => {
        const st = getDeadlineStatus(e.registrationDeadline);
        return st.urgency === 'urgent' || st.urgency === 'soon';
      }).length,
    [allCompetitions]
  );

  const myEntriesCount = useMemo(
    () => allCompetitions.filter((e) => regByEventId.has(e.id)).length,
    [allCompetitions, regByEventId]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Technical Competitions
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Compare prize pools, team eligibility, remaining slots, and registration deadlines across active collegiate challenges.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {COMP_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setDiscipline(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                discipline === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4-column competition metrics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Active Competitions</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-slate-900">
            {allCompetitions.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Combined Prize Pool</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-slate-900">
            ${totalPrizeValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Closing Within 5 Days</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-amber-700">
            {closingSoonCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Your Active Entries</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-semibold text-blue-700">
            {myEntriesCount}
          </div>
        </div>
      </div>

      {/* Structured Competition Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-5">Competition & Organizer</th>
                <th className="py-3.5 px-4">Discipline</th>
                <th className="py-3.5 px-4">Team Size</th>
                <th className="py-3.5 px-4">Event Date</th>
                <th className="py-3.5 px-4">Deadline</th>
                <th className="py-3.5 px-4 text-right">Prize Pool</th>
                <th className="py-3.5 px-4 text-right">Slots Filled</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {competitions.map((comp) => {
                const reg = regByEventId.get(comp.id);
                const saved = savedEventIds.includes(comp.id);
                const deadline = getDeadlineStatus(comp.registrationDeadline);

                return (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 max-w-xs">
                      <button
                        type="button"
                        onClick={() => onSelectEvent(comp)}
                        className="text-left font-semibold text-slate-900 hover:text-blue-700 transition-colors"
                      >
                        {comp.title}
                      </button>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {comp.organizer} · {comp.venue}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {comp.category}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 font-mono tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        {comp.teamSizeMin}–{comp.teamSizeMax}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatShortDate(comp.startDate)}
                    </td>
                    <td className="py-4 px-4 text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                          deadline.urgency === 'urgent'
                            ? 'text-red-600'
                            : deadline.urgency === 'soon'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {deadline.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                        {comp.prizePool || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      {comp.registeredCount} / {comp.capacity}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleSave(comp.id)}
                          aria-label={saved ? `Unsave ${comp.title}` : `Save ${comp.title}`}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            saved
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                        </button>
                        {reg ? (
                          <button
                            type="button"
                            onClick={() => onSelectEvent(comp)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 whitespace-nowrap shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            {reg.ticketCode}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onQuickRegister(comp)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                          >
                            Register Team
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
