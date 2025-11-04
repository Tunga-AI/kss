// Sales Competency Definitions for Yusudi Assessment
export interface CompetencyDefinition {
  id: string;
  name: string;
  description: string;
  category: 'Core Sales' | 'Customer Management' | 'Business Acumen' | 'Personal Skills';
  weight: number; // Percentage weight in overall assessment
}

export interface QuestionCompetencyMapping {
  questionId: string;
  competencyId: string;
  weight: number; // How much this question contributes to the competency
}

export const COMPETENCY_DEFINITIONS: CompetencyDefinition[] = [
  // Core Sales Competencies
  {
    id: 'prospecting',
    name: 'Prospecting & Lead Generation',
    description: 'Ability to identify, research, and qualify potential customers through various channels',
    category: 'Core Sales',
    weight: 15
  },
  {
    id: 'presentation_skills',
    name: 'Presentation & Demo Skills',
    description: 'Effectively presenting solutions, conducting product demonstrations, and storytelling',
    category: 'Core Sales',
    weight: 12
  },
  {
    id: 'objection_handling',
    name: 'Objection Handling',
    description: 'Addressing customer concerns, overcoming resistance, and turning objections into opportunities',
    category: 'Core Sales',
    weight: 13
  },
  {
    id: 'closing_techniques',
    name: 'Closing Techniques',
    description: 'Successfully closing deals using various techniques and recognizing buying signals',
    category: 'Core Sales',
    weight: 14
  },
  
  // Customer Management Competencies
  {
    id: 'relationship_building',
    name: 'Relationship Building',
    description: 'Building trust, rapport, and long-term relationships with customers and stakeholders',
    category: 'Customer Management',
    weight: 12
  },
  {
    id: 'needs_assessment',
    name: 'Needs Assessment & Discovery',
    description: 'Asking the right questions to understand customer needs, pain points, and decision criteria',
    category: 'Customer Management',
    weight: 11
  },
  {
    id: 'customer_service',
    name: 'Customer Service Excellence',
    description: 'Providing exceptional post-sale support and managing customer satisfaction',
    category: 'Customer Management',
    weight: 8
  },
  
  // Business Acumen Competencies
  {
    id: 'market_knowledge',
    name: 'Market & Industry Knowledge',
    description: 'Understanding market trends, competitive landscape, and industry dynamics',
    category: 'Business Acumen',
    weight: 7
  },
  {
    id: 'value_proposition',
    name: 'Value Proposition Development',
    description: 'Articulating unique value and ROI to different customer segments',
    category: 'Business Acumen',
    weight: 8
  }
];

// Question Bank with Competency Mappings
export interface SalesQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  competencyId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
}

export const SALES_QUESTION_BANK: SalesQuestion[] = [
  // Prospecting & Lead Generation Questions
  {
    id: 'pros_001',
    questionText: 'What is the most effective first step when prospecting a new potential client?',
    options: [
      'Immediately call them to set up a meeting',
      'Research the company and decision-makers thoroughly',
      'Send a generic email with your company brochure',
      'Connect on LinkedIn without a personalized message'
    ],
    correctAnswer: 1,
    explanation: 'Research is crucial for effective prospecting. Understanding the company, its challenges, and key decision-makers allows for more targeted and relevant outreach.',
    competencyId: 'prospecting',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'pros_002',
    questionText: 'Which metric is most important when measuring prospecting effectiveness?',
    options: [
      'Number of calls made per day',
      'Number of emails sent',
      'Conversion rate from prospect to qualified lead',
      'Hours spent on LinkedIn'
    ],
    correctAnswer: 2,
    explanation: 'Conversion rate from prospect to qualified lead measures quality over quantity and indicates how well you\'re targeting and engaging the right prospects.',
    competencyId: 'prospecting',
    difficulty: 'intermediate',
    points: 2
  },
  {
    id: 'pros_003',
    questionText: 'When using social selling on LinkedIn, what should be your primary focus?',
    options: [
      'Posting about your products daily',
      'Adding as many connections as possible',
      'Sharing valuable industry insights and engaging meaningfully',
      'Sending direct sales pitches to new connections'
    ],
    correctAnswer: 2,
    explanation: 'Social selling is about building relationships and establishing thought leadership by sharing valuable content and engaging authentically with your network.',
    competencyId: 'prospecting',
    difficulty: 'intermediate',
    points: 2
  },

  // Presentation & Demo Skills Questions
  {
    id: 'pres_001',
    questionText: 'What is the most important element of a successful sales presentation?',
    options: [
      'Using the latest PowerPoint templates',
      'Focusing on your company\'s history and achievements',
      'Tailoring the message to the specific audience\'s needs',
      'Covering every feature of your product'
    ],
    correctAnswer: 2,
    explanation: 'Successful presentations are customer-centric and address the specific needs, challenges, and goals of the audience.',
    competencyId: 'presentation_skills',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'pres_002',
    questionText: 'During a product demo, a customer asks about a feature your product doesn\'t have. What\'s the best approach?',
    options: [
      'Promise that the feature will be available soon',
      'Acknowledge honestly and redirect to your product\'s strengths',
      'Pretend the feature exists and hope they don\'t notice',
      'Immediately offer a discount to compensate'
    ],
    correctAnswer: 1,
    explanation: 'Honesty builds trust. Acknowledge what you don\'t have, then pivot to demonstrate how your existing features solve their core problems.',
    competencyId: 'presentation_skills',
    difficulty: 'intermediate',
    points: 2
  },
  {
    id: 'pres_003',
    questionText: 'What storytelling technique is most effective in sales presentations?',
    options: [
      'Always start with your company\'s founding story',
      'Use customer success stories relevant to the prospect\'s situation',
      'Focus on your personal sales achievements',
      'Tell stories about your competitors\' failures'
    ],
    correctAnswer: 1,
    explanation: 'Relevant customer success stories help prospects envision how your solution can work for them and provide social proof.',
    competencyId: 'presentation_skills',
    difficulty: 'intermediate',
    points: 2
  },

  // Objection Handling Questions
  {
    id: 'obj_001',
    questionText: 'When a prospect says "Your price is too high," what should you do first?',
    options: [
      'Immediately offer a discount',
      'Defend your pricing by listing all features',
      'Ask questions to understand their budget and value perception',
      'Show them competitor pricing to justify your costs'
    ],
    correctAnswer: 2,
    explanation: 'Understanding the root of price objections helps you address the real concern, whether it\'s budget constraints, unclear value, or comparison issues.',
    competencyId: 'objection_handling',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'obj_002',
    questionText: 'A prospect says "We need to think about it." What\'s your best response?',
    options: [
      'That\'s fine, I\'ll follow up in a month',
      'What specifically do you need to think about?',
      'Most clients say that, but they usually decide to move forward',
      'Would a discount help you decide faster?'
    ],
    correctAnswer: 1,
    explanation: 'This response helps uncover the real objection behind the delay and allows you to address specific concerns rather than accepting a vague stall.',
    competencyId: 'objection_handling',
    difficulty: 'intermediate',
    points: 2
  },
  {
    id: 'obj_003',
    questionText: 'How should you handle objections that arise during your presentation?',
    options: [
      'Address them immediately as they come up',
      'Ask the prospect to hold questions until the end',
      'Acknowledge the concern and address it at an appropriate moment',
      'Ignore them and hope they forget'
    ],
    correctAnswer: 2,
    explanation: 'Acknowledging shows you\'re listening, while addressing at the right moment keeps your presentation flow intact and ensures proper context.',
    competencyId: 'objection_handling',
    difficulty: 'advanced',
    points: 3
  },

  // Closing Techniques Questions
  {
    id: 'close_001',
    questionText: 'What is a buying signal that indicates a prospect is ready to make a decision?',
    options: [
      'They ask about your company\'s history',
      'They inquire about implementation timelines',
      'They request more product brochures',
      'They ask to speak with your manager'
    ],
    correctAnswer: 1,
    explanation: 'Questions about implementation, next steps, or timelines indicate the prospect is mentally moving from "if" to "when" they\'ll purchase.',
    competencyId: 'closing_techniques',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'close_002',
    questionText: 'Which closing technique is most effective for consultative selling?',
    options: [
      'The hard close: "Do you want to buy today or not?"',
      'The assumptive close: "When would you like to get started?"',
      'The summary close: "Based on what we\'ve discussed, this solution addresses your key needs..."',
      'The urgency close: "This offer expires tomorrow"'
    ],
    correctAnswer: 2,
    explanation: 'The summary close reinforces value and shows how you\'ve listened to their needs, making it natural for them to agree to move forward.',
    competencyId: 'closing_techniques',
    difficulty: 'intermediate',
    points: 2
  },
  {
    id: 'close_003',
    questionText: 'After presenting your solution, the prospect seems interested but hesitant. What\'s your next move?',
    options: [
      'Ask directly: "What\'s holding you back from moving forward?"',
      'Start negotiating on price',
      'Give them time to think and follow up later',
      'Offer additional features at no extra cost'
    ],
    correctAnswer: 0,
    explanation: 'A direct question helps identify and address the real barrier to closing, rather than making assumptions about what the issue might be.',
    competencyId: 'closing_techniques',
    difficulty: 'intermediate',
    points: 2
  },

  // Relationship Building Questions
  {
    id: 'rel_001',
    questionText: 'What\'s the foundation of building strong customer relationships?',
    options: [
      'Always being available 24/7',
      'Offering the lowest prices in the market',
      'Consistently delivering on promises and being trustworthy',
      'Taking clients out for expensive dinners regularly'
    ],
    correctAnswer: 2,
    explanation: 'Trust is built through reliability and consistency. When customers know they can count on you to deliver what you promise, relationships strengthen.',
    competencyId: 'relationship_building',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'rel_002',
    questionText: 'How can you add value to a client relationship beyond your core product?',
    options: [
      'Send holiday cards every year',
      'Share relevant industry insights and introductions',
      'Always agree with everything they say',
      'Offer discounts on every interaction'
    ],
    correctAnswer: 1,
    explanation: 'Providing valuable insights, introductions, and industry knowledge positions you as a trusted advisor rather than just a vendor.',
    competencyId: 'relationship_building',
    difficulty: 'intermediate',
    points: 2
  },
  {
    id: 'rel_003',
    questionText: 'When managing multiple stakeholders in a B2B sale, what\'s most important?',
    options: [
      'Focus only on the final decision maker',
      'Treat all stakeholders equally with the same message',
      'Understand each stakeholder\'s unique motivations and concerns',
      'Avoid dealing with too many people to keep things simple'
    ],
    correctAnswer: 2,
    explanation: 'Each stakeholder has different priorities, concerns, and success metrics. Tailoring your approach to each person\'s perspective increases buy-in.',
    competencyId: 'relationship_building',
    difficulty: 'advanced',
    points: 3
  },

  // Needs Assessment & Discovery Questions
  {
    id: 'needs_001',
    questionText: 'What type of questions should you ask first when conducting needs discovery?',
    options: [
      'Leading questions that guide toward your solution',
      'Open-ended questions about their current situation',
      'Closed-ended questions for quick answers',
      'Questions about their budget and timeline'
    ],
    correctAnswer: 1,
    explanation: 'Open-ended questions encourage prospects to share their situation, challenges, and goals, providing valuable context before diving into specifics.',
    competencyId: 'needs_assessment',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'needs_002',
    questionText: 'A prospect mentions a problem your solution can\'t solve. What should you do?',
    options: [
      'Promise your product will be updated to handle it',
      'Minimize the importance of that problem',
      'Acknowledge it and explore if there are other ways to help',
      'Immediately pivot to problems you can solve'
    ],
    correctAnswer: 2,
    explanation: 'Acknowledging limitations builds trust, and exploring alternatives shows you\'re focused on their success, not just making a sale.',
    competencyId: 'needs_assessment',
    difficulty: 'intermediate',
    points: 2
  },
  {
    id: 'needs_003',
    questionText: 'Which discovery technique is most effective for understanding the impact of a problem?',
    options: [
      'Ask: "Is this a big problem for you?"',
      'Ask: "What happens if this problem isn\'t solved?"',
      'Ask: "Have you tried to solve this before?"',
      'Ask: "Who else is affected by this problem?"'
    ],
    correctAnswer: 1,
    explanation: 'Understanding consequences helps quantify the problem\'s impact and creates urgency while revealing the cost of inaction.',
    competencyId: 'needs_assessment',
    difficulty: 'intermediate',
    points: 2
  },

  // Customer Service Excellence Questions
  {
    id: 'service_001',
    questionText: 'A customer is frustrated with a delayed delivery. What\'s your first priority?',
    options: [
      'Explain all the reasons for the delay',
      'Acknowledge their frustration and apologize',
      'Offer a discount for the inconvenience',
      'Blame the shipping company or supplier'
    ],
    correctAnswer: 1,
    explanation: 'Acknowledging emotions and taking responsibility demonstrates empathy and accountability, which helps de-escalate the situation.',
    competencyId: 'customer_service',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'service_002',
    questionText: 'What\'s the most important aspect of following up with customers after a sale?',
    options: [
      'Asking for referrals immediately',
      'Checking if they need additional products',
      'Ensuring they\'re achieving their desired outcomes',
      'Scheduling the next sales call'
    ],
    correctAnswer: 2,
    explanation: 'Customer success is about outcome achievement. When customers succeed with your solution, they become advocates and loyal buyers.',
    competencyId: 'customer_service',
    difficulty: 'intermediate',
    points: 2
  },

  // Market & Industry Knowledge Questions
  {
    id: 'market_001',
    questionText: 'Why is understanding your competitors important in sales?',
    options: [
      'To copy their strategies exactly',
      'To bad-mouth them to prospects',
      'To differentiate your value proposition effectively',
      'To match their pricing exactly'
    ],
    correctAnswer: 2,
    explanation: 'Understanding competitors helps you articulate your unique value and position your solution effectively without resorting to negative tactics.',
    competencyId: 'market_knowledge',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'market_002',
    questionText: 'How can market trends information be used effectively in sales conversations?',
    options: [
      'To impress prospects with your knowledge',
      'To create urgency by highlighting market changes',
      'To show how industry shifts make your solution more relevant',
      'To predict exactly what competitors will do next'
    ],
    correctAnswer: 2,
    explanation: 'Connecting market trends to your solution\'s relevance helps prospects understand why timing matters and how you can help them adapt.',
    competencyId: 'market_knowledge',
    difficulty: 'intermediate',
    points: 2
  },

  // Value Proposition Development Questions
  {
    id: 'value_001',
    questionText: 'What makes a value proposition compelling to prospects?',
    options: [
      'Listing all your product features',
      'Showing clear benefits specific to their situation',
      'Emphasizing your company\'s awards and recognition',
      'Comparing your features to competitors\' features'
    ],
    correctAnswer: 1,
    explanation: 'A compelling value proposition connects your capabilities directly to their specific needs and desired outcomes.',
    competencyId: 'value_proposition',
    difficulty: 'beginner',
    points: 1
  },
  {
    id: 'value_002',
    questionText: 'When should you present ROI calculations to a prospect?',
    options: [
      'In your first conversation to grab attention',
      'Only if they specifically ask about ROI',
      'After understanding their current costs and desired outcomes',
      'Never, because ROI is too complicated for most buyers'
    ],
    correctAnswer: 2,
    explanation: 'ROI calculations are meaningful only when based on their actual situation, costs, and goals. Premature ROI discussions lack credibility.',
    competencyId: 'value_proposition',
    difficulty: 'intermediate',
    points: 2
  },

  // Advanced Scenario Questions
  {
    id: 'scenario_001',
    questionText: 'You\'re in a competitive deal where price is a major factor. What\'s your best strategy?',
    options: [
      'Match the competitor\'s price exactly',
      'Focus the conversation on total cost of ownership and value',
      'Offer additional services for free',
      'Highlight all the problems with the competitor\'s solution'
    ],
    correctAnswer: 1,
    explanation: 'Shifting from price to value helps prospects see beyond initial cost to consider long-term benefits, implementation costs, and overall value.',
    competencyId: 'value_proposition',
    difficulty: 'advanced',
    points: 3
  },
  {
    id: 'scenario_002',
    questionText: 'A key stakeholder who supported your solution has left the company mid-sale. What should you do?',
    options: [
      'Wait to see who replaces them',
      'Ask your original contact to introduce you to other supporters',
      'Start the sales process over with new stakeholders',
      'Try to reach the departed stakeholder at their new company'
    ],
    correctAnswer: 1,
    explanation: 'Leveraging existing relationships to build new ones maintains momentum while expanding your support base within the organization.',
    competencyId: 'relationship_building',
    difficulty: 'advanced',
    points: 3
  }
];

export const QUESTION_SET_SIZE = 15;
export const TOTAL_QUESTION_SETS = 10;
export const TEST_TIME_LIMIT = 30; // minutes

// Function to generate randomized question sets
export const generateRandomQuestionSet = (setNumber: number): SalesQuestion[] => {
  // Ensure reproducible randomization for each set
  const seed = setNumber * 137; // Simple seeding
  let random = seed;
  
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  // Create a copy of the question bank and shuffle it
  const shuffledQuestions = [...SALES_QUESTION_BANK].sort(() => seededRandom() - 0.5);
  
  // Select 15 questions ensuring coverage across competencies
  const selectedQuestions: SalesQuestion[] = [];
  const competencyCounts: {[key: string]: number} = {};
  
  // First, ensure at least one question from each major competency
  const majorCompetencies = ['prospecting', 'presentation_skills', 'objection_handling', 'closing_techniques', 'relationship_building'];
  
  for (const competency of majorCompetencies) {
    const competencyQuestions = shuffledQuestions.filter(q => q.competencyId === competency);
    if (competencyQuestions.length > 0 && selectedQuestions.length < QUESTION_SET_SIZE) {
      selectedQuestions.push(competencyQuestions[0]);
      competencyCounts[competency] = (competencyCounts[competency] || 0) + 1;
    }
  }
  
  // Fill remaining slots with diverse questions
  for (const question of shuffledQuestions) {
    if (selectedQuestions.length >= QUESTION_SET_SIZE) break;
    
    if (!selectedQuestions.find(q => q.id === question.id)) {
      const competencyCount = competencyCounts[question.competencyId] || 0;
      // Limit questions per competency to ensure diversity
      if (competencyCount < 4) {
        selectedQuestions.push(question);
        competencyCounts[question.competencyId] = competencyCount + 1;
      }
    }
  }
  
  // Fill any remaining slots
  for (const question of shuffledQuestions) {
    if (selectedQuestions.length >= QUESTION_SET_SIZE) break;
    if (!selectedQuestions.find(q => q.id === question.id)) {
      selectedQuestions.push(question);
    }
  }
  
  return selectedQuestions.slice(0, QUESTION_SET_SIZE);
};