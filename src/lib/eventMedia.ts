import heroHackathonImg from '../assets/images/hero_hackathon_campus_1794580613883.jpg';
import roboticsArenaImg from '../assets/images/event_robotics_arena_1794580613161.jpg';
import aiSummitImg from '../assets/images/event_ai_summit_1794580613995.jpg';
import designStudioImg from '../assets/images/event_design_studio_1794580615250.jpg';
import studentAvatarImg from '../assets/images/student_avatar_muskan_1794580615237.jpg';
import type { ImageKey } from '../types';

export const EVENT_MEDIA: Record<ImageKey, { src: string; alt: string }> = {
  hackathon: {
    src: heroHackathonImg,
    alt: 'Students collaborating around laptops and hardware microcontrollers inside the university engineering atrium',
  },
  robotics: {
    src: roboticsArenaImg,
    alt: 'Autonomous student rover navigating an obstacle course inside the campus robotics arena',
  },
  'ai-summit': {
    src: aiSummitImg,
    alt: 'Speaker presenting systems and AI architecture diagrams in a university lecture auditorium',
  },
  'design-studio': {
    src: designStudioImg,
    alt: 'Students inspecting 3D-printed hardware prototypes and architectural plans in a sunlit design studio',
  },
};

export const STUDENT_AVATAR = studentAvatarImg;
