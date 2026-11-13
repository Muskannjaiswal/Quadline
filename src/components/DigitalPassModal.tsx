import { Calendar, CheckCircle2, MapPin, X } from 'lucide-react';
import { formatEventDateRange } from '../lib/formatters';
import type { CampusEvent, Registration, StudentProfile } from '../types';

interface DigitalPassModalProps {
  event: CampusEvent;
  registration: Registration;
  profile: StudentProfile;
  onClose: () => void;
}

export function DigitalPassModal({
  event,
  registration,
  profile,
  onClose,
}: DigitalPassModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-300">Quadline Student Check-in Pass</div>
            <div className="font-mono text-lg font-semibold tracking-wide mt-0.5">
              {registration.ticketCode}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close digital pass"
            className="p-1.5 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {registration.status} Entry
            </div>
            <h2
              id="pass-modal-title"
              className="mt-1 font-display text-xl font-bold text-slate-900"
            >
              {event.title}
            </h2>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                {formatEventDateRange(event.startDate, event.endDate)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                {event.venue}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 text-xs">
            <div>
              <div className="text-slate-400">Attendee</div>
              <div className="font-semibold text-slate-900 mt-0.5">{profile.name}</div>
              <div className="font-mono text-slate-500 mt-0.5">{profile.studentId}</div>
            </div>
            <div>
              <div className="text-slate-400">Assigned Track</div>
              <div className="font-semibold text-slate-900 mt-0.5">{registration.track}</div>
              {registration.teamName && (
                <div className="text-slate-600 mt-0.5">Team: {registration.teamName}</div>
              )}
            </div>
          </div>

          {/* Crisp deterministic verification matrix SVG */}
          <div className="flex flex-col items-center justify-center py-2">
            <svg
              viewBox="0 0 180 48"
              className="w-56 h-12 text-slate-900"
              aria-label={`Verification barcode ${registration.ticketCode}`}
            >
              {[4, 10, 14, 20, 26, 30, 38, 44, 52, 58, 62, 70, 76, 82, 90, 96, 104, 110, 118, 124, 130, 138, 144, 152, 160, 168].map(
                (x, idx) => (
                  <rect
                    key={x}
                    x={x}
                    y={4}
                    width={idx % 3 === 0 ? 4 : 2}
                    height={40}
                    fill="currentColor"
                  />
                )
              )}
            </svg>
            <div className="mt-1.5 font-mono text-xs text-slate-500 tracking-widest">
              {registration.ticketCode}-{profile.studentId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
