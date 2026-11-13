import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { EVENT_MEDIA } from '../lib/eventMedia';
import type { ImageKey } from '../types';

interface EventImageProps {
  imageKey: ImageKey;
  title: string;
  className?: string;
}

export function EventImage({ imageKey, title, className = '' }: EventImageProps) {
  const [failed, setFailed] = useState(false);
  const media = EVENT_MEDIA[imageKey] || EVENT_MEDIA.hackathon;

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 border-b border-slate-200 px-4 text-center ${className}`}
      >
        <Calendar className="w-7 h-7 mb-2 text-slate-400" />
        <span className="text-xs font-medium text-slate-600 line-clamp-2">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={media.src}
      alt={media.alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover bg-slate-100 ${className}`}
    />
  );
}
