import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CampusEvent, EventCategory, EventFormat, ImageKey } from '../types';

interface SubmitEventModalProps {
  onClose: () => void;
  onCreateEvent: (
    payload: Omit<CampusEvent, 'id' | 'registeredCount' | 'featured' | 'schedule' | 'requirements'>
  ) => Promise<void>;
}

const CATEGORIES: EventCategory[] = [
  'Hackathon',
  'Robotics',
  'Coding Contest',
  'Workshop',
  'Symposium',
  'Design Sprint',
  'Cultural & Club',
];

function inferImageKey(category: EventCategory): ImageKey {
  if (category === 'Robotics') return 'robotics';
  if (category === 'Design Sprint') return 'design-studio';
  if (category === 'Symposium') return 'ai-summit';
  return 'hackathon';
}

export function SubmitEventModal({ onClose, onCreateEvent }: SubmitEventModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [category, setCategory] = useState<EventCategory>('Hackathon');
  const [isCompetition, setIsCompetition] = useState(true);
  const [format, setFormat] = useState<EventFormat>('In-Person');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('2026-11-29T10:00');
  const [endDate, setEndDate] = useState('2026-11-29T18:00');
  const [deadline, setDeadline] = useState('2026-11-26T23:59');
  const [prizePool, setPrizePool] = useState('$1,000');
  const [capacity, setCapacity] = useState(80);
  const [teamMax, setTeamMax] = useState(3);
  const [tracksRaw, setTracksRaw] = useState('Main Track, Beginner Track');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !organizer.trim() || !venue.trim() || !subtitle.trim()) {
      setError('Please complete title, subtitle, organizer, and venue.');
      return;
    }

    setSubmitting(true);
    try {
      const numericPrize = Number(prizePool.replace(/[^0-9]/g, '')) || 0;
      await onCreateEvent({
        title: title.trim(),
        subtitle: subtitle.trim(),
        organizer: organizer.trim(),
        department: department.trim() || 'Student Affairs',
        category,
        isCompetition,
        format,
        venue: venue.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        registrationDeadline: new Date(deadline).toISOString(),
        teamSizeMin: 1,
        teamSizeMax: Math.max(1, teamMax),
        prizePool: isCompetition && prizePool.trim() ? prizePool.trim() : undefined,
        prizeValue: isCompetition ? numericPrize : undefined,
        tracks: tracksRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        eligibility: 'All Enrolled Students',
        capacity: Math.max(10, capacity),
        imageKey: inferImageKey(category),
        description:
          description.trim() ||
          `${subtitle.trim()} Hosted by ${organizer.trim()} at ${venue.trim()}.`,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-event-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 id="submit-event-title" className="font-display text-lg font-bold text-slate-900">
            Publish Campus Event or Competition
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Campus Open-Source Sprint"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                One-Line Summary <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Concise overview shown on discovery cards"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organizer / Club <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="e.g. IEEE Student Chapter"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Engineering Hall 204"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as EventFormat)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Starts</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ends</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seat Capacity
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompetition}
                  onChange={(e) => setIsCompetition(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                This is a judged technical competition with prizes
              </label>
            </div>

            {isCompetition && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prize Pool
                  </label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="e.g. $2,000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={teamMax}
                    onChange={(e) => setTeamMax(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tracks (comma-separated)
              </label>
              <input
                type="text"
                value={tracksRaw}
                onChange={(e) => setTracksRaw(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Description & Department
              </label>
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Sponsoring Department"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe format, judging criteria, or equipment provided..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
