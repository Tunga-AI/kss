/**
 * Seed: Create 3 progressive-level sales assessments in Firestore (kenyasales DB)
 * and save the default Key Competencies configuration to kenyasales DB.
 *
 * Run: node scripts/seed-assessments.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:e5f52aa7d526a2fe88b9ae",
};

const app = initializeApp(firebaseConfig);
const defaultDb = getFirestore(app);                     // default DB (programs etc)
const kenyasalesDb = getFirestore(app, 'kenyasales');    // kenyasales DB — assessments + competency config live here

// ─── Competency config ────────────────────────────────────────────────────────
const COMPETENCY_CATEGORIES = [
  {
    id: 'analysis-expertise', name: 'Analysis and Expertise',
    description: 'Gathering, evaluating, and using any relevant information to understand the environment and act accordingly.',
    competencies: [
      { id: 'knowledge-sharing', name: 'Knowledge Sharing', description: 'Transmitting one\'s capabilities and expertise to others.' },
      { id: 'analytical-thinking', name: 'Analytical Thinking', description: 'Breaking down problems and complex situations into components to find appropriate solutions.' },
      { id: 'decision-making', name: 'Decision Making', description: 'Making the best possible choice based on the information available.' },
      { id: 'knowledge-management', name: 'Knowledge Management', description: 'Following the evolution of knowledge in one\'s field regularly to be up to date.' },
      { id: 'learning-agility', name: 'Learning Agility', description: 'Showing an inquisitive mind with a high interest in new things.' },
      { id: 'perspective-taking', name: 'Perspective Taking', description: 'Taking a step back to analyze facts and situations objectively before acting.' },
    ],
  },
  {
    id: 'commercial-skills', name: 'Commercial Skills',
    description: 'Achieving sales goals by convincing clients, maintaining sales pressure, and identifying business opportunities.',
    competencies: [
      { id: 'understanding-needs', name: 'Understanding Needs', description: 'Asking the right questions to accurately pinpoint a customer\'s needs.' },
      { id: 'customer-satisfaction', name: 'Customer Satisfaction', description: 'Being responsive in handling customers\' queries and requests.' },
      { id: 'pitching', name: 'Pitching', description: 'Conversing in a manner that is subtle yet impactful in order to persuade.' },
      { id: 'prospecting-skills', name: 'Prospecting Skills', description: 'Developing a solid client base, by being convincing, sociable, and tenacious.' },
      { id: 'closing-deals', name: 'Closing Deals', description: 'Directing negotiations to a definite end point, with a positive outcome for both parties.' },
      { id: 'strategic-selling', name: 'Strategic Selling', description: 'Handling complex sales that involve multiple stakeholders.' },
      { id: 'sales-drive', name: 'Sales Drive', description: 'Having a taste for, and being driven by, the successes and challenges of making a sale.' },
      { id: 'networking', name: 'Networking', description: 'Making contacts and developing a network of influential people.' },
      { id: 'identification-of-opportunities', name: 'Identification of Opportunities', description: 'Understanding the market to identify and seize business opportunities.' },
      { id: 'empathic-sales', name: 'Empathic Sales', description: 'Using a sales approach governed by codes of conduct to deliver services in the interest of customers.' },
    ],
  },
  {
    id: 'communication-influence', name: 'Communication and Influence',
    description: 'Understanding and being understood by others by actively listening and sharing ideas in an adapted manner.',
    competencies: [
      { id: 'listening-skills', name: 'Listening Skills', description: 'Being attentive to and effectively interpreting what the other person is saying.' },
      { id: 'self-affirmation', name: 'Self-affirmation', description: 'Expressing and defending one\'s point of view with assertiveness.' },
      { id: 'conduct-of-negotiation', name: 'Conduct of Negotiation', description: 'Negotiating effectively, by being diplomatic and strategic.' },
      { id: 'presentation-skills', name: 'Presentation Skills', description: 'Presenting facts in a logical, understandable manner.' },
      { id: 'influencing-skills', name: 'Influencing Skills', description: 'Promoting ideas, and convincing others, communicating assertively and tactically.' },
      { id: 'strategic-communication', name: 'Strategic Communication', description: 'Sharing the most relevant information, adapting to the audience\'s needs.' },
      { id: 'charisma', name: 'Charisma', description: 'Showing natural charm and a personal presence to connect with and influence others.' },
    ],
  },
  {
    id: 'management', name: 'Management',
    description: 'Leading a team, knowing how to delegate and evaluate performance.',
    competencies: [
      { id: 'delegation', name: 'Delegation', description: 'Assigning tasks and responsibilities appropriately.' },
      { id: 'promoting-change', name: 'Promoting Change', description: 'Communicating a new vision in a clear, engaging, and inspirational manner.' },
      { id: 'performance-management', name: 'Performance Management', description: 'Evaluating, monitoring, and managing employee performance.' },
      { id: 'leadership', name: 'Leadership', description: 'Leading a group towards a common goal, by being a source of motivation and inspiration.' },
      { id: 'managerial-courage', name: 'Managerial Courage', description: 'Speaking confidently and setting limits when the situation demands it.' },
      { id: 'mentoring', name: 'Mentoring', description: 'Taking responsibility for the development and progression of others.' },
    ],
  },
  {
    id: 'planning-vision', name: 'Planning and Vision',
    description: 'Assessing the environment to think creatively, organize work effectively, and anticipate consequences.',
    competencies: [
      { id: 'organization-skills', name: 'Organization Skills', description: 'Organising and scheduling work or tasks methodically.' },
      { id: 'global-vision', name: 'Global Vision', description: 'Looking at the big picture to grasp things as a whole.' },
      { id: 'innovation-creativity', name: 'Innovation-Creativity', description: 'Thinking outside the box and looking at things from new perspectives.' },
      { id: 'risk-management', name: 'Risk Management', description: 'Identifying opportunities, priorities, and risks to minimize failure.' },
      { id: 'strategic-planning', name: 'Strategic Planning', description: 'Anticipating and establishing action to achieve long-term goals.' },
      { id: 'time-management', name: 'Time Management', description: 'Prioritising tasks pragmatically so as to meet deadlines.' },
      { id: 'multitasking', name: 'Multitasking', description: 'Carrying out multiple tasks simultaneously, while ensuring minimal risk of error.' },
      { id: 'project-management', name: 'Project Management', description: 'Taking charge of and following up on tasks from design to delivery.' },
      { id: 'crisis-management', name: 'Crisis Management', description: 'Anticipating, facing, and learning from a crisis.' },
    ],
  },
  {
    id: 'relationship-management', name: 'Relationship Management',
    description: 'Interacting effectively with others, promoting cooperation, minimizing conflict.',
    competencies: [
      { id: 'team-motivation', name: 'Team Motivation', description: 'Creating a harmonious environment within a group by fostering team spirit.' },
      { id: 'empathy', name: 'Empathy', description: 'Effectively identifying and understanding the needs of another person.' },
      { id: 'team-cohesion', name: 'Team Cohesion', description: 'Encouraging activities that will enable united and productive teams.' },
      { id: 'helping-others', name: 'Helping Others', description: 'Identifying, prioritizing, and helping others meet their wants or needs.' },
      { id: 'interpersonal-skills', name: 'Interpersonal Skills', description: 'Interacting effectively and building healthy relationships with others.' },
      { id: 'conflict-resolution', name: 'Conflict Resolution', description: 'Maintaining harmony within the team by mediating conflicts.' },
    ],
  },
  {
    id: 'self-management', name: 'Self-management and Self-knowledge',
    description: 'Questioning one\'s thoughts and actions in a deliberate and pertinent manner.',
    competencies: [
      { id: 'respecting-instructions', name: 'Respecting Instructions', description: 'Adhering to procedures by following and implementing directives.' },
      { id: 'responsiveness', name: 'Responsiveness', description: 'Adjusting quickly to unexpected changes to plans and situations.' },
      { id: 'self-appraisal', name: 'Self-appraisal', description: 'Having a critical view of one\'s performance.' },
      { id: 'stress-management', name: 'Stress Management', description: 'Managing one\'s own emotions, remaining calm and productive in challenging situations.' },
    ],
  },
  {
    id: 'values-integrity', name: 'Values and Integrity',
    description: 'Following principles and standards of ethical behavior.',
    competencies: [
      { id: 'discretion', name: 'Discretion', description: 'Respecting confidentiality and exercising restraint in the disclosure of information.' },
      { id: 'impartiality', name: 'Impartiality', description: 'Treating people fairly and basing decisions on objective criteria.' },
      { id: 'modesty', name: 'Modesty', description: 'Being modest when it comes to estimating one\'s abilities.' },
      { id: 'respect', name: 'Respect', description: 'Behaving with regard to other\'s feelings, wishes, or rights.' },
      { id: 'openness-to-diversity', name: 'Openness to Diversity', description: 'Showing tolerance and acceptance of other people\'s ways of thinking.' },
      { id: 'sense-of-duty', name: 'Sense of Duty', description: 'Respecting and adhering to codes of conduct, remaining honest, and being reliable.' },
    ],
  },
  {
    id: 'work-commitment', name: 'Work Commitment',
    description: 'Demonstrating sincere commitment to the company\'s goals.',
    competencies: [
      { id: 'availability', name: 'Availability', description: 'Being committed to the organization and willing to offer help whenever possible.' },
      { id: 'involvement', name: 'Involvement', description: 'Being highly committed and putting maximum energy into achieving work-related objectives.' },
      { id: 'initiative', name: 'Initiative', description: 'Seizing opportunities and being a driving force to create or move things forward.' },
      { id: 'quality-orientation', name: 'Quality Orientation', description: 'Being meticulous with an eye for detail to ensure the highest level of quality.' },
      { id: 'striving', name: 'Striving', description: 'Constantly seeking to excel and surpass one\'s goal.' },
      { id: 'taking-responsibility', name: 'Taking Responsibility', description: 'Taking ownership of projects, and accepting the consequences of their success or failure.' },
    ],
  },
  {
    id: 'additional', name: 'Additional',
    description: 'Additional competencies relevant to the role.',
    competencies: [
      { id: 'adaptation-to-change', name: 'Adaptation to Change', description: 'Being able to adapt to change, adjusting one\'s behavior or attitude.' },
      { id: 'persistence', name: 'Persistence', description: 'Demonstrating determination and maintaining a high level of energy in the performance of duties.' },
    ],
  },
];

// ─── 3 Sample Assessments ─────────────────────────────────────────────────────

const ASSESSMENTS = [
  {
    title: 'Junior Sales Fundamentals',
    description: 'This assessment evaluates foundational sales skills for entry-level sales professionals. It covers understanding customer needs, effective communication, relationship building, and basic selling principles. Passing score: 70%. Time limit: 30 minutes.',
    passingScore: 70,
    timeLimit: 30,
    status: 'Active',
    competencyIds: ['commercial-skills', 'communication-influence', 'relationship-management'],
    programId: '',
    programTitle: '',
    questions: [
      {
        id: 'q1',
        question: 'A new prospect says "I\'m happy with my current supplier." What is the best first response?',
        type: 'multiple-choice',
        options: [
          'Immediately offer a lower price than the competitor',
          'Ask what they value most about their current supplier and listen carefully',
          'Tell them your product is better in every way',
          'Accept their response and end the conversation politely'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'understanding-needs',
        competencyName: 'Understanding Needs',
      },
      {
        id: 'q2',
        question: 'A customer complains that their delivery was late. What best demonstrates Customer Satisfaction?',
        type: 'multiple-choice',
        options: [
          'Explain that delays happen and it is outside your control',
          'Apologize, investigate the issue, and proactively offer a solution',
          'Redirect the conversation to your new product offerings',
          'Tell them you will pass the feedback to the logistics team'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'customer-satisfaction',
        competencyName: 'Customer Satisfaction',
      },
      {
        id: 'q3',
        question: 'During a sales pitch, you notice the prospect looks distracted. What should you do?',
        type: 'multiple-choice',
        options: [
          'Continue with the presentation at a faster pace',
          'Ask an engaging question to re-involve them and adjust your approach',
          'Stop the meeting and reschedule for another time',
          'Send a follow-up email with the full presentation later'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'pitching',
        competencyName: 'Pitching',
      },
      {
        id: 'q4',
        question: 'What is the most effective method for building an initial prospect list?',
        type: 'multiple-choice',
        options: [
          'Cold calling random numbers from a phone directory',
          'Buying a generic leads database from an online vendor',
          'Researching your target market using LinkedIn and industry events',
          'Waiting for inbound enquiries from your company\'s website'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'prospecting-skills',
        competencyName: 'Prospecting Skills',
      },
      {
        id: 'q5',
        question: 'Active listening in a sales conversation means:',
        type: 'multiple-choice',
        options: [
          'Nodding frequently to show you are paying attention',
          'Planning your next point while the customer speaks',
          'Fully focusing on the customer, asking clarifying questions, and summarising what was said',
          'Taking notes on everything the customer says verbatim'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'listening-skills',
        competencyName: 'Listening Skills',
      },
      {
        id: 'q6',
        question: 'A client is comparing your product against two competitors before a meeting. The most empathic sales approach is:',
        type: 'multiple-choice',
        options: [
          'Offer a discount valid only for the next 24 hours to force a quick decision',
          'Speak negatively about the competitors to highlight their weaknesses',
          'Understand the client\'s priorities and tailor your conversation around how you best meet their needs',
          'Ask the client to share the competitor\'s quotes so you can undercut them'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'empathic-sales',
        competencyName: 'Empathic Sales',
      },
      {
        id: 'q7',
        question: 'Which of the following best describes building interpersonal skills in a sales context?',
        type: 'multiple-choice',
        options: [
          'Memorising a script and delivering it the same way every time',
          'Adapting your communication style to match the personality and preferences of each customer',
          'Focusing only on product knowledge to build credibility',
          'Keeping all interactions short and strictly professional'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'interpersonal-skills',
        competencyName: 'Interpersonal Skills',
      },
      {
        id: 'q8',
        question: 'A key benefit of regular follow-up with prospects who are not yet ready to buy is:',
        type: 'multiple-choice',
        options: [
          'It shows the prospect that you are desperate for the sale',
          'It wastes valuable time that should be spent on already qualified leads',
          'It keeps you top-of-mind so when they are ready to buy, they think of you first',
          'It puts pressure on the prospect to make a faster decision'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'customer-satisfaction',
        competencyName: 'Customer Satisfaction',
      },
      {
        id: 'q9',
        question: 'When presenting your product\'s price to a prospect, the best practice is:',
        type: 'multiple-choice',
        options: [
          'Share the price at the very beginning to filter out unqualified leads immediately',
          'Always negotiate downward immediately when asked for a price',
          'Present value first, then introduce price in the context of the benefit it delivers',
          'Avoid mentioning price unless the prospect specifically asks'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'pitching',
        competencyName: 'Pitching',
      },
      {
        id: 'q10',
        question: 'Empathy in sales is best demonstrated when:',
        type: 'multiple-choice',
        options: [
          'You match the customer\'s emotional tone in every conversation',
          'You genuinely understand the customer\'s situation and tailor your recommendations to their best interest',
          'You share personal stories to build emotional connection',
          'You agree with everything the customer says to avoid conflict'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'empathy',
        competencyName: 'Empathy',
      },
    ],
  },

  {
    title: 'Mid-Level Sales Professional',
    description: 'This assessment is designed for experienced sales professionals with 3–7 years in the field. It tests skills in deal negotiation, strategic selling, risk assessment, and performance management. Passing score: 70%. Time limit: 35 minutes.',
    passingScore: 70,
    timeLimit: 35,
    status: 'Active',
    competencyIds: ['commercial-skills', 'communication-influence', 'planning-vision', 'management'],
    programId: '',
    programTitle: '',
    questions: [
      {
        id: 'q1',
        question: 'You are closing a large deal but the procurement team is pushing for a 20% discount. What is the most effective response?',
        type: 'multiple-choice',
        options: [
          'Immediately grant the discount to avoid losing the deal',
          'Refuse firmly and let them decide without offering any flexibility',
          'Explore what value or trade is important to them and negotiate around mutual benefit, not just price',
          'Ask your manager to take over the negotiation'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'closing-deals',
        competencyName: 'Closing Deals',
      },
      {
        id: 'q2',
        question: 'A complex deal involves a CEO, a Finance Director, and an Operations Manager, all with different priorities. What best reflects Strategic Selling?',
        type: 'multiple-choice',
        options: [
          'Focus all your energy on winning over the CEO since they have final authority',
          'Create a single proposal that addresses all three stakeholders\' priorities and align your pitch accordingly',
          'Propose a pilot project to one stakeholder before approaching the others',
          'Send the same email to all three simultaneously to save time'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'strategic-selling',
        competencyName: 'Strategic Selling',
      },
      {
        id: 'q3',
        question: 'Which of the following is the most strategic approach to managing your sales pipeline?',
        type: 'multiple-choice',
        options: [
          'Focus exclusively on deals that are most likely to close this month',
          'Prioritise deals by deal size only',
          'Segment deals by probability, size, and timeline, and allocate effort accordingly',
          'Treat every deal in the pipeline equally regardless of stage'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'risk-management',
        competencyName: 'Risk Management',
      },
      {
        id: 'q4',
        question: 'During a negotiation, the prospect goes silent after you present the contract terms. The best action is:',
        type: 'multiple-choice',
        options: [
          'Immediately offer a further concession to fill the silence',
          'Keep quiet, allow them to think, and wait for their response',
          'Repeat your terms more loudly to emphasise their value',
          'End the meeting and follow up the next day with a revised proposal'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'conduct-of-negotiation',
        competencyName: 'Conduct of Negotiation',
      },
      {
        id: 'q5',
        question: 'A key account has been a loyal customer for 5 years but hasn\'t grown in revenue. What strategic action would best identify new opportunities?',
        type: 'multiple-choice',
        options: [
          'Send a discount offer to incentivise more purchases',
          'Conduct a detailed account review meeting to understand their evolving business goals and unmet needs',
          'Introduce them to new products via a product catalogue email',
          'Reduce your visit frequency to save relationship capital for later'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'identification-of-opportunities',
        competencyName: 'Identification of Opportunities',
      },
      {
        id: 'q6',
        question: 'To maintain high performance across your sales territory, you should:',
        type: 'multiple-choice',
        options: [
          'Focus only on your top 3 accounts and limit contact with the rest',
          'Set weekly KPIs for activity, pipeline health, and conversion rates and review them regularly',
          'Rely on intuition to decide which accounts need attention',
          'Report results at the end of the quarter only'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'performance-management',
        competencyName: 'Performance Management',
      },
      {
        id: 'q7',
        question: 'Influencing a stakeholder who is skeptical of your product is best done by:',
        type: 'multiple-choice',
        options: [
          'Repeating your value proposition more frequently and with more urgency',
          'Building credibility through evidence, case studies, and addressing their specific concerns directly',
          'Bypassing them and going directly to their superior',
          'Focusing entirely on the positive and avoiding any mention of limitations'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'influencing-skills',
        competencyName: 'Influencing Skills',
      },
      {
        id: 'q8',
        question: 'A prospect asks for a detailed ROI analysis before committing. What is the most effective approach?',
        type: 'multiple-choice',
        options: [
          'Tell them ROI is difficult to calculate and move on',
          'Provide a generic ROI calculator from your marketing department',
          'Co-develop a custom ROI model with the client using their own data and assumptions',
          'Delay the request until the final stage of negotiation'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'analytical-thinking',
        competencyName: 'Analytical Thinking',
      },
      {
        id: 'q9',
        question: 'Which approach best demonstrates Sales Drive when you are behind on your quarterly target?',
        type: 'multiple-choice',
        options: [
          'Wait for inbound leads to pick up in the next quarter',
          'Intensify outreach, re-engage stalled prospects, and identify accelerated paths to close',
          'Reduce your prices significantly to generate fast revenue',
          'Ask your manager to transfer some accounts from a higher-performing colleague'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'sales-drive',
        competencyName: 'Sales Drive',
      },
      {
        id: 'q10',
        question: 'When mentoring a junior salesperson who consistently misses their KPIs, you should:',
        type: 'multiple-choice',
        options: [
          'Escalate the issue to HR immediately',
          'Reassign their accounts to more experienced reps',
          'Ride along on calls, identify skill gaps, and create a structured development plan with regular check-ins',
          'Send them motivational material and tell them to push harder'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'mentoring',
        competencyName: 'Mentoring',
      },
    ],
  },

  {
    title: 'Senior Strategic Sales Leadership',
    description: 'This assessment is designed for senior sales leaders, directors, and senior account managers. It evaluates strategic planning, leadership, networking at the C-suite level, innovation, and crisis management. Passing score: 70%. Time limit: 40 minutes.',
    passingScore: 70,
    timeLimit: 40,
    status: 'Active',
    competencyIds: ['planning-vision', 'management', 'commercial-skills', 'communication-influence', 'self-management'],
    programId: '',
    programTitle: '',
    questions: [
      {
        id: 'q1',
        question: 'A sudden economic downturn causes your three largest accounts to freeze their budgets. As a sales leader, what is the most strategic immediate response?',
        type: 'multiple-choice',
        options: [
          'Immediately cut your team\'s targets and report the situation to the board',
          'Conduct rapid account reviews, identify retained value, pivot messaging to ROI-preservation, and open new prospecting pipelines',
          'Focus on reducing operational costs until the market stabilises',
          'Request emergency discounts from procurement for your top accounts'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'crisis-management',
        competencyName: 'Crisis Management',
      },
      {
        id: 'q2',
        question: 'You are building a 3-year sales growth strategy for a new market segment. The most critical first step is:',
        type: 'multiple-choice',
        options: [
          'Set ambitious revenue targets for year one to motivate the team',
          'Conduct a thorough market analysis, map customer personas, and validate assumptions before setting targets',
          'Hire additional sales reps to cover the new segment immediately',
          'Copy the strategy that worked in your existing market segment'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'strategic-planning',
        competencyName: 'Strategic Planning',
      },
      {
        id: 'q3',
        question: 'As a sales director, you want to introduce a new CRM system that your team is resistant to. How do you best promote this change?',
        type: 'multiple-choice',
        options: [
          'Mandate the new system with immediate effect and enforce compliance through performance reviews',
          'Share a clear vision of how the CRM will benefit their work, involve key team members in the rollout, and address resistance through coaching',
          'Pilot the system with only the top performers to prove its value',
          'Delay the rollout until resistance subsides naturally'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'promoting-change',
        competencyName: 'Promoting Change',
      },
      {
        id: 'q4',
        question: 'To build a high-value network that generates strategic referrals, the most effective long-term approach is:',
        type: 'multiple-choice',
        options: [
          'Connect with as many people as possible on LinkedIn and send mass outreach messages',
          'Attend every industry event and collect business cards',
          'Consistently add value to a curated network by sharing insights, making warm introductions, and nurturing relationships over time',
          'Partner only with other sales professionals in your direct industry'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'networking',
        competencyName: 'Networking',
      },
      {
        id: 'q5',
        question: 'Your sales team is achieving targets but the market is disrupted by a new competitor with an innovative model. The most appropriate leadership response is:',
        type: 'multiple-choice',
        options: [
          'Maintain current strategy since the team is hitting targets',
          'Respond by deeply discounting your products to retain market share',
          'Conduct a strategic review, explore innovative responses, and develop a plan to differentiate or adapt before market share erodes',
          'Wait for the competitor to fail on their own'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'innovation-creativity',
        competencyName: 'Innovation-Creativity',
      },
      {
        id: 'q6',
        question: 'A senior member of your team consistently underperforms but has strong relationships with key clients. How do you lead through this situation?',
        type: 'multiple-choice',
        options: [
          'Protect the client relationships at all costs and work around the individual\'s performance issues',
          'Immediately transition the accounts and terminate the team member',
          'Have a direct performance conversation, set clear measurable expectations, provide support, and involve HR in a structured performance plan',
          'Assign a junior rep to shadow them without discussing the performance issue directly'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'leadership',
        competencyName: 'Leadership',
      },
      {
        id: 'q7',
        question: 'In a C-suite presentation about your company\'s sales strategy, the most effective communication approach is:',
        type: 'multiple-choice',
        options: [
          'Present detailed operational data and KPIs to demonstrate competence',
          'Lead with a compelling strategic narrative tied to business outcomes, backed by selected data points',
          'Keep the presentation short with no data to avoid confusion',
          'Focus on what the sales team has achieved in the last quarter only'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'strategic-communication',
        competencyName: 'Strategic Communication',
      },
      {
        id: 'q8',
        question: 'A key emerging market opportunity is identified by your team but requires resources you don\'t currently have. The best approach to global vision is:',
        type: 'multiple-choice',
        options: [
          'Dismiss it since the resources aren\'t available right now',
          'Build a business case showing the long-term strategic value, engage cross-functional stakeholders, and propose a phased investment plan',
          'Ask the team to pursue it informally with existing resources',
          'Wait for a competitor to validate the market first before entering'
        ],
        correctAnswer: 1,
        points: 10,
        competencyId: 'global-vision',
        competencyName: 'Global Vision',
      },
      {
        id: 'q9',
        question: 'Managing stress effectively as a sales leader under extreme quarterly pressure means:',
        type: 'multiple-choice',
        options: [
          'Absorbing all the pressure yourself so your team stays focused',
          'Directing pressure downward to motivate the team through urgency',
          'Maintaining composure, modelling calm purposeful action, and being transparent with your team about challenges while focusing on solutions',
          'Delegating all decisions to avoid stress-driven mistakes'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'stress-management',
        competencyName: 'Stress Management',
      },
      {
        id: 'q10',
        question: 'Which of the following best reflects Taking Responsibility as a senior sales leader when the team misses its annual target?',
        type: 'multiple-choice',
        options: [
          'Identify individual contributors who underperformed and ensure they face consequences',
          'Cite market conditions and external factors as the primary reason for missing targets',
          'Own the outcome, present a candid analysis of what contributed to the miss, and lead the team in building a recovery plan',
          'Reframe the target as too ambitious and request it be revised retroactively'
        ],
        correctAnswer: 2,
        points: 10,
        competencyId: 'taking-responsibility',
        competencyName: 'Taking Responsibility',
      },
    ],
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Save competency config to kenyasales DB
  console.log('\n📋 Saving Key Competency configuration to kenyasales DB...');
  await setDoc(
    doc(kenyasalesDb, 'competencyConfig', 'main'),
    { categories: COMPETENCY_CATEGORIES, updatedAt: new Date() },
    { merge: true }
  );
  console.log(`✅ Saved ${COMPETENCY_CATEGORIES.length} competency categories.`);

  // 2. Check existing assessments to avoid duplicates (in kenyasales DB)
  const existingSnap = await getDocs(query(collection(kenyasalesDb, 'assessments')));
  const existingTitles = new Set(existingSnap.docs.map(d => d.data().title));
  console.log(`\n📊 Found ${existingSnap.size} existing assessments in kenyasales.`);

  // 3. Seed assessments into kenyasales DB (where list/detail pages read from)
  console.log('\n🧪 Seeding sample assessments into kenyasales...');
  let created = 0;
  for (const assessment of ASSESSMENTS) {
    if (existingTitles.has(assessment.title)) {
      console.log(`  ⏩ Skipping "${assessment.title}" — already exists.`);
      continue;
    }
    const docRef = await addDoc(collection(kenyasalesDb, 'assessments'), {
      ...assessment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`  ✅ Created "${assessment.title}" → ${docRef.id}`);
    created++;
  }

  console.log(`\n✅ Done. ${created} assessment(s) created. ${ASSESSMENTS.length - created} skipped (already exist).`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
