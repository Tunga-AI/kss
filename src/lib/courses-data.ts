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

export const courses: Course[] = [
  {
    id: 'sales-101',
    title: 'Sales Fundamentals 101',
    description: 'Master the core principles of sales, from prospecting to closing deals. Perfect for beginners.',
    imageId: 'course-sales-101',
    duration: '4 weeks',
    level: 'Beginner',
    takeaways: [
      'Understand the full sales cycle from start to finish.',
      'Develop effective prospecting and lead qualification skills.',
      'Master the art of the sales pitch and product demonstration.',
      'Learn key closing techniques to seal the deal.',
    ],
    price: '$499',
  },
  {
    id: 'advanced-negotiation',
    title: 'Advanced Negotiation Tactics',
    description: 'Learn to negotiate like a pro and maximize your win rates in complex sales scenarios.',
    imageId: 'course-advanced-negotiation',
    duration: '6 weeks',
    level: 'Advanced',
    takeaways: [
      'Apply advanced psychological principles in negotiation.',
      'Master multi-party and high-stakes negotiation strategies.',
      'Learn to counter common negotiation tactics.',
      'Develop skills for creating win-win outcomes.',
    ],
    price: '$899',
  },
  {
    id: 'crm-mastery',
    title: 'CRM Mastery for Sales Teams',
    description: 'Leverage your CRM to its full potential to manage pipelines and foster customer relationships.',
    imageId: 'course-crm-mastery',
    duration: '3 weeks',
    level: 'Intermediate',
    takeaways: [
      'Automate sales tasks and workflows within your CRM.',
      'Build and manage a clean and effective sales pipeline.',
      'Utilize CRM data to generate insightful sales reports.',
      'Integrate your CRM with other sales and marketing tools.',
    ],
    price: '$399',
  },
  {
    id: 'digital-prospecting',
    title: 'Digital Prospecting & Lead Gen',
    description: 'Utilize modern digital tools and social media to find and engage with potential customers effectively.',
    imageId: 'course-digital-prospecting',
    duration: '5 weeks',
    level: 'Intermediate',
    takeaways: [
      'Master social selling techniques on platforms like LinkedIn.',
      'Build effective email outreach campaigns that get responses.',
      'Leverage sales intelligence tools to find qualified leads.',
      'Create a repeatable system for digital lead generation.',
    ],
    price: '$699',
  },
];
