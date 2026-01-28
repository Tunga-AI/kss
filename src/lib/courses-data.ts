export type Course = {
  id: string;
  title: string;
  description: string;
  imageId: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
};

export const courses: Course[] = [
  {
    id: 'sales-101',
    title: 'Sales Fundamentals 101',
    description: 'Master the core principles of sales, from prospecting to closing deals. Perfect for beginners.',
    imageId: 'course-sales-101',
    duration: '4 weeks',
    level: 'Beginner',
  },
  {
    id: 'advanced-negotiation',
    title: 'Advanced Negotiation Tactics',
    description: 'Learn to negotiate like a pro and maximize your win rates in complex sales scenarios.',
    imageId: 'course-advanced-negotiation',
    duration: '6 weeks',
    level: 'Advanced',
  },
  {
    id: 'crm-mastery',
    title: 'CRM Mastery for Sales Teams',
    description: 'Leverage your CRM to its full potential to manage pipelines and foster customer relationships.',
    imageId: 'course-crm-mastery',
    duration: '3 weeks',
    level: 'Intermediate',
  },
  {
    id: 'digital-prospecting',
    title: 'Digital Prospecting & Lead Gen',
    description: 'Utilize modern digital tools and social media to find and engage with potential customers effectively.',
    imageId: 'course-digital-prospecting',
    duration: '5 weeks',
    level: 'Intermediate',
  },
];
