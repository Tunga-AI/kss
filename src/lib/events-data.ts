export type Event = {
  id: string;
  title: string;
  description: string;
  imageId: string;
  date: string;
  time: string;
  location: string;
  price: 'Free' | string;
  speakers: { name: string; title: string; avatar: string }[];
};

export const events: Event[] = [
  {
    id: 'webinar-sales-psychology',
    title: 'Webinar: The Psychology of Sales',
    description: 'Join our expert panel to explore the psychological triggers that drive purchasing decisions. Understand the "why" behind the buy.',
    imageId: 'event-webinar-psychology',
    date: '2024-08-15',
    time: '2:00 PM EAT',
    location: 'Online',
    price: 'Free',
    speakers: [
      { name: 'Dr. Evelyn Reed', title: 'Behavioral Psychologist', avatar: 'https://picsum.photos/seed/sp1/40/40' },
      { name: 'Mark Chen', title: 'VP of Sales, TechCorp', avatar: 'https://picsum.photos/seed/sp2/40/40' },
    ],
  },
  {
    id: 'workshop-cold-calling',
    title: 'Workshop: Mastering the Cold Call',
    description: 'A hands-on, full-day workshop to build confidence and develop scripts that get results. Includes live calling sessions with feedback.',
    imageId: 'event-workshop-calling',
    date: '2024-09-05',
    time: '10:00 AM - 4:00 PM EAT',
    location: 'KSS Institute, Nairobi',
    price: 'KES 29,900',
    speakers: [
        { name: 'Brenda Miles', title: 'Top 1% Sales Coach', avatar: 'https://picsum.photos/seed/sp3/40/40' },
    ],
  },
  {
    id: 'conference-sales-summit',
    title: 'Annual Sales Summit 2024',
    description: 'Network with industry leaders, discover new trends, and celebrate the art of sales. The premier event for sales professionals.',
    imageId: 'event-conference-summit',
    date: '2024-10-20',
    time: '9:00 AM - 5:00 PM EAT',
    location: 'Villa Rosa Kempinski, Nairobi',
    price: 'KES 79,900',
    speakers: [
      { name: 'James Clear', title: 'Author of "Atomic Habits"', avatar: 'https://picsum.photos/seed/sp4/40/40' },
      { name: 'Jill Konrath', title: 'Sales Strategist', avatar: 'https://picsum.photos/seed/sp5/40/40' },
      { name: 'David Siegel', title: 'CEO, Meetup', avatar: 'https://picsum.photos/seed/sp6/40/40' },
    ],
  },
   {
    id: 'webinar-social-selling',
    title: 'Webinar: Social Selling Success',
    description: 'Learn how to leverage social media platforms like LinkedIn to build relationships and drive sales in the digital age.',
    imageId: 'event-webinar-social',
    date: '2024-11-12',
    time: '1:00 PM EAT',
    location: 'Online',
    price: 'Free',
    speakers: [
        { name: 'Daniela Garcia', title: 'LinkedIn Top Voice', avatar: 'https://picsum.photos/seed/sp7/40/40' },
    ],
  },
];
