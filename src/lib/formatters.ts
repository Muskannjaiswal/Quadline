export function formatEventDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (sameDay) {
    return `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} – ${dateFmt.format(end)}, ${end.getFullYear()}`;
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatTimeOnly(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function getDeadlineStatus(deadlineIso: string): {
  label: string;
  urgency: 'closed' | 'urgent' | 'soon' | 'open';
  hoursLeft: number;
} {
  const now = Date.now();
  const target = new Date(deadlineIso).getTime();
  const diffMs = target - now;
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) {
    return { label: 'Registration closed', urgency: 'closed', hoursLeft: 0 };
  }
  if (hoursLeft < 48) {
    const days = Math.floor(hoursLeft / 24);
    const remHours = hoursLeft % 24;
    return {
      label: days > 0 ? `Closes in ${days}d ${remHours}h` : `Closes in ${Math.max(1, hoursLeft)}h`,
      urgency: 'urgent',
      hoursLeft,
    };
  }
  const daysLeft = Math.ceil(hoursLeft / 24);
  if (daysLeft <= 5) {
    return { label: `Closes in ${daysLeft} days`, urgency: 'soon', hoursLeft };
  }
  return {
    label: `Deadline ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(deadlineIso))}`,
    urgency: 'open',
    hoursLeft,
  };
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso);
}
