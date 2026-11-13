export type EventCategory =
  | 'Hackathon'
  | 'Robotics'
  | 'Coding Contest'
  | 'Workshop'
  | 'Symposium'
  | 'Design Sprint'
  | 'Cultural & Club';

export type EventFormat = 'In-Person' | 'Hybrid' | 'Online';

export type ImageKey = 'hackathon' | 'robotics' | 'ai-summit' | 'design-studio';

export interface EventScheduleItem {
  time: string;
  title: string;
  location: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  subtitle: string;
  organizer: string;
  department: string;
  category: EventCategory;
  isCompetition: boolean;
  format: EventFormat;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  teamSizeMin: number;
  teamSizeMax: number;
  prizePool?: string;
  prizeValue?: number;
  tracks: string[];
  eligibility: string;
  capacity: number;
  registeredCount: number;
  featured: boolean;
  imageKey: ImageKey;
  description: string;
  schedule: EventScheduleItem[];
  requirements: string[];
}

export interface Registration {
  id: string;
  eventId: string;
  ticketCode: string;
  status: 'Confirmed' | 'Waitlisted' | 'Checked In';
  registeredAt: string;
  track: string;
  teamName?: string;
  teammates: string[];
  notes?: string;
  reminderEnabled: boolean;
}

export type NotificationType =
  | 'Deadline'
  | 'Registration'
  | 'Schedule Update'
  | 'Competition Alert'
  | 'Recommendation';

export interface EventNotification {
  id: string;
  eventId?: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: 'Urgent' | 'Normal';
}

export interface StudentProfile {
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  interests: EventCategory[];
  reminderHoursBefore: number;
  emailDigest: boolean;
}

export interface PortalState {
  events: CampusEvent[];
  registrations: Registration[];
  notifications: EventNotification[];
  savedEventIds: string[];
  profile: StudentProfile;
}
