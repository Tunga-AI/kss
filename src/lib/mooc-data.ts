export type Course = {
  id: string;
  title: string;
  description: string;
  imageId: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  takeaways: string[];
  price: string;
};

export const moocCourses: Course[] = [
  {
    id: 'intro-to-sales',
    title: 'Introduction to Professional Sales',
    description: 'A comprehensive introduction to the world of professional sales. Free for all learners.',
    imageId: 'course-sales-101',
    duration: '8 hours',
    level: 'Beginner',
    takeaways: [
      'Understand the role of a sales professional.',
      'Learn the basic stages of the sales funnel.',
      'Develop initial communication skills for sales.',
      'Get an overview of different sales methodologies.',
    ],
    price: 'Free',
  },
  {
    id: 'social-selling-basics',
    title: 'Social Selling Fundamentals',
    description: 'Learn how to leverage social media to build your personal brand and find prospects.',
    imageId: 'course-digital-prospecting',
    duration: '6 hours',
    level: 'Beginner',
    takeaways: [
      'Optimize your LinkedIn profile for sales.',
      'Learn content strategies to engage your network.',
      'Understand how to use social media for lead generation.',
      'Build a professional online presence.',
    ],
    price: 'Free',
  },
  {
    id: 'effective-communication',
    title: 'Effective Communication for Sales',
    description: 'Master the art of clear, concise, and persuasive communication.',
    imageId: 'event-workshop-calling',
    duration: '10 hours',
    level: 'Intermediate',
    takeaways: [
      'Learn active listening techniques.',
      'Master verbal and non-verbal communication skills.',
      'Tailor your communication style to different clients.',
      'Improve your presentation and storytelling skills.',
    ],
    price: 'Free',
  },
  {
    id: 'sales-tech-stack',
    title: 'Understanding the Modern Sales Tech Stack',
    description: 'An overview of the essential tools used by modern sales teams, from CRMs to sales intelligence platforms.',
    imageId: 'course-crm-mastery',
    duration: '5 hours',
    level: 'Intermediate',
    takeaways: [
      'Understand the purpose of a CRM.',
      'Learn about sales engagement platforms.',
      'Discover tools for lead generation and data enrichment.',
      'Get an overview of sales analytics tools.',
    ],
    price: 'Free',
  },
];
