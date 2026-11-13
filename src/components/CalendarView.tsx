import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { formatTimeOnly } from '../lib/formatters';
import type { CampusEvent, Registration } from '../types';

interface CalendarViewProps {
  events: CampusEvent[];
  registrations: Registration[];
  savedEventIds: string[];
  onSelectEvent: (event: CampusEvent) => void;
}

const MONTH_OPTIONS = [
  { year: 2026, month: 10, label: 'November 2026' },
  { year: 2026, month: 11, label: 'December 2026' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CalendarView({
  events,
  registrations,
  savedEventIds,
  onSelectEvent,
}: CalendarViewProps) {
  const [monthIdx, setMonthIdx] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState('2026-11-19');

  const currentMonth = MONTH_OPTIONS[monthIdx];
  const regEventIds = useMemo(
    () => new Set(registrations.map((r) => r.eventId)),
    [registrations]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CampusEvent[]>();
    events.forEach((event) => {
      const key = dateKey(new Date(event.startDate));
      const arr = map.get(key) || [];
      arr.push(event);
      map.set(key, arr);
    });
    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
    const startOffset = firstDay.getDay();

    const cells: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, key: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, key: k });
    }
    return cells;
  }, [currentMonth]);

  const selectedEvents = useMemo(
    () => eventsByDay.get(selectedDayKey) || [],
    [eventsByDay, selectedDayKey]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus Event Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect upcoming event dates and verify your registered sessions for schedule conflicts.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 self-start sm:self-auto">
          <button
            type="button"
            disabled={monthIdx === 0}
            onClick={() => setMonthIdx(0)}
            aria-label="Previous month"
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-35"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
            {currentMonth.label}
          </span>
          <button
            type="button"
            disabled={monthIdx === MONTH_OPTIONS.length - 1}
            onClick={() => setMonthIdx(1)}
            aria-label="Next month"
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-35"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 px-2 text-center text-xs font-semibold text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.key) {
                return <div key={`empty-${idx}`} className="min-h-[88px] bg-slate-50/40" />;
              }

              const dayEvents = eventsByDay.get(cell.key) || [];
              const isSelected = selectedDayKey === cell.key;
              const isToday = cell.key === '2026-11-13';

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDayKey(cell.key!)}
                  className={`min-h-[92px] p-2 text-left flex flex-col justify-between transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-blue-50/60 ring-1 ring-inset ring-blue-500' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono tabular-nums font-semibold ${
                        isToday
                          ? 'text-blue-700 underline underline-offset-4'
                          : isSelected
                          ? 'text-blue-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1.5 w-full">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const isReg = regEventIds.has(ev.id);
                      const isSaved = savedEventIds.includes(ev.id);
                      return (
                        <div
                          key={ev.id}
                          className={`text-[11px] px-1.5 py-0.5 rounded truncate font-medium ${
                            isReg
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isSaved
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-slate-500 pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day agenda */}
        <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-500">Selected Date</div>
            <h2 className="font-display text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(`${selectedDayKey}T12:00:00`))}
            </h2>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-4 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-400" />
              Registered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-200 border border-blue-400" />
              Saved
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
              Open
            </span>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="py-10 text-center border-t border-slate-100">
              <CalendarIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No campus events scheduled on this date.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {selectedEvents.map((ev) => {
                const isReg = regEventIds.has(ev.id);
                return (
                  <div key={ev.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">
                        {formatTimeOnly(ev.startDate)} – {formatTimeOnly(ev.endDate)}
                      </span>
                      {isReg && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Registered
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className="text-left font-display text-base font-semibold text-slate-900 hover:text-blue-700 transition-colors"
                    >
                      {ev.title}
                    </button>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      {ev.venue}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
