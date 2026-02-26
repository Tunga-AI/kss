import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CompetencyCategory, CompetencyConfig } from './assessment-types';

const CONFIG_DOC = 'competencyConfig/main';

export async function getCompetencyConfig(usersFirestore: Firestore): Promise<CompetencyConfig | null> {
    const ref = doc(usersFirestore, CONFIG_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CompetencyConfig;
}

export async function saveCompetencyConfig(
    usersFirestore: Firestore,
    categories: CompetencyCategory[]
): Promise<void> {
    const ref = doc(usersFirestore, CONFIG_DOC);
    await setDoc(ref, { categories, updatedAt: serverTimestamp() }, { merge: true });
}

export function getDefaultCompetencies(): CompetencyCategory[] {
    return [
        {
            id: 'analysis-expertise',
            name: 'Analysis and Expertise',
            description: 'Gathering, evaluating, and using any relevant information to understand the environment and act accordingly.',
            competencies: [
                { id: 'knowledge-sharing', name: 'Knowledge Sharing', description: 'Transmitting one\'s capabilities and expertise to others.' },
                { id: 'analytical-thinking', name: 'Analytical Thinking', description: 'Breaking down problems and complex situations into components to find appropriate solutions.' },
                { id: 'decision-making', name: 'Decision Making', description: 'Making the best possible choice based on the information available, as well as being able to explain these decisions.' },
                { id: 'knowledge-management', name: 'Knowledge Management', description: 'Following the evolution of knowledge in one\'s field or service regularly in order to be up to date and gain expertise.' },
                { id: 'learning-agility', name: 'Learning Agility', description: 'Showing an inquisitive mind with a high interest in new things.' },
                { id: 'perspective-taking', name: 'Perspective Taking', description: 'Taking a step back to analyze facts and situations objectively before acting or deciding.' },
            ],
        },
        {
            id: 'commercial-skills',
            name: 'Commercial Skills',
            description: 'Achieving sales goals by convincing clients, maintaining sales pressure, and identifying business opportunities.',
            competencies: [
                { id: 'understanding-needs', name: 'Understanding Needs', description: 'Asking the right questions to accurately pinpoint a customer\'s needs.' },
                { id: 'customer-satisfaction', name: 'Customer Satisfaction', description: 'Being responsive in handling customers\' queries and requests, to generate loyalty and positive experiences for them.' },
                { id: 'pitching', name: 'Pitching', description: 'Conversing in a manner that is subtle yet impactful in order to persuade the person or audience one is speaking to.' },
                { id: 'prospecting-skills', name: 'Prospecting Skills', description: 'Developing a solid client base, by being convincing, sociable, and tenacious.' },
                { id: 'closing-deals', name: 'Closing Deals', description: 'Directing negotiations to a definite end point, with a positive outcome for both parties.' },
                { id: 'strategic-selling', name: 'Strategic Selling', description: 'Handling complex sales that involve multiple stakeholders, while ensuring that the solutions offered are tailor-made to meet the business approach appropriately.' },
                { id: 'sales-drive', name: 'Sales Drive', description: 'Having a taste for, as well as being driven by, the successes and challenges that come with making a sale or closing a deal.' },
                { id: 'networking', name: 'Networking', description: 'Making contacts and developing a network of influential people for potential opportunities.' },
                { id: 'identification-of-opportunities', name: 'Identification of Opportunities', description: 'Understanding the market perfectly in order to be able to identify and seize business opportunities.' },
                { id: 'empathic-sales', name: 'Empathic Sales', description: 'Using a sales approach governed by codes of conduct or standards, and regulations to deliver services in the interest of the customers.' },
            ],
        },
        {
            id: 'communication-influence',
            name: 'Communication and Influence',
            description: 'Understanding and being understood by others by actively listening to others and sharing ideas and information in an adapted manner.',
            competencies: [
                { id: 'listening-skills', name: 'Listening Skills', description: 'Being attentive to, caring about, and effectively interpreting what the other person is saying.' },
                { id: 'self-affirmation', name: 'Self-affirmation', description: 'Expressing and defending one\'s point of view with assertiveness, while showing respect for oneself and others.' },
                { id: 'conduct-of-negotiation', name: 'Conduct of Negotiation', description: 'Negotiating effectively, by being diplomatic and strategic to find a profitable agreement.' },
                { id: 'presentation-skills', name: 'Presentation Skills', description: 'Presenting facts in a logical, and understandable manner, relevant to the situation.' },
                { id: 'influencing-skills', name: 'Influencing Skills', description: 'Promoting ideas, and convincing others, as well as communicating in an assertive and tactical manner.' },
                { id: 'strategic-communication', name: 'Strategic Communication', description: 'Sharing the most relevant information, and adapting to the audience\'s needs and understanding.' },
                { id: 'charisma', name: 'Charisma', description: 'Showing natural charm, and a personal presence in order to connect with and influence others.' },
            ],
        },
        {
            id: 'management',
            name: 'Management',
            description: 'Leading a team, knowing how to delegate and evaluate performance, and communicating in an inspiring manner.',
            competencies: [
                { id: 'delegation', name: 'Delegation', description: 'Assigning tasks and responsibilities appropriately, according to individual abilities and needs.' },
                { id: 'promoting-change', name: 'Promoting Change', description: 'Communicating a new vision in a clear, engaging, and inspirational manner in order to encourage the involvement of all.' },
                { id: 'performance-management', name: 'Performance Management', description: 'Evaluating, monitoring, and managing employee performance in order to maintain standards and achieve objectives.' },
                { id: 'leadership', name: 'Leadership', description: 'Leading a group towards a common goal, by being a source of motivation and inspiration.' },
                { id: 'managerial-courage', name: 'Managerial Courage', description: 'Speaking confidently and setting limits when the situation demands it.' },
                { id: 'mentoring', name: 'Mentoring', description: 'Taking responsibility for the development and progression of others, by coaching as well as helping them improve.' },
            ],
        },
        {
            id: 'planning-vision',
            name: 'Planning and Vision',
            description: 'Assessing the environment in order to think creatively, organize work effectively, and anticipate the consequences of actions.',
            competencies: [
                { id: 'organization-skills', name: 'Organization Skills', description: 'Organising and scheduling work or tasks in a way that is methodical and rigorous.' },
                { id: 'global-vision', name: 'Global Vision', description: 'Looking at the big picture to grasp things as a whole.' },
                { id: 'innovation-creativity', name: 'Innovation-Creativity', description: 'Thinking outside the box and looking at things from new perspectives.' },
                { id: 'risk-management', name: 'Risk Management', description: 'Identifying opportunities, priorities, and risks with the aim of minimizing the probability of failure and increasing the chances of success.' },
                { id: 'strategic-planning', name: 'Strategic Planning', description: 'Anticipating and establishing action to achieve long-term goals.' },
                { id: 'time-management', name: 'Time Management', description: 'Prioritising tasks pragmatically so as to meet deadlines.' },
                { id: 'multitasking', name: 'Multitasking', description: 'Carrying out multiple tasks or projects simultaneously, while ensuring minimal risk of error.' },
                { id: 'project-management', name: 'Project Management', description: 'Taking charge of and following up on tasks that lead to the completion of a project, from design to delivery.' },
                { id: 'crisis-management', name: 'Crisis Management', description: 'Anticipating, facing, and learning from a crisis.' },
            ],
        },
        {
            id: 'relationship-management',
            name: 'Relationship Management',
            description: 'Interacting effectively with others, promoting cooperation, minimizing conflict, and enabling people to work towards common goals.',
            competencies: [
                { id: 'team-motivation', name: 'Team Motivation', description: 'Creating a harmonious environment within a group by fostering team spirit and building synergy.' },
                { id: 'empathy', name: 'Empathy', description: 'Effectively identifying and understanding the needs of another person.' },
                { id: 'team-cohesion', name: 'Team Cohesion', description: 'Encouraging activities that will enable united and productive teams.' },
                { id: 'helping-others', name: 'Helping Others', description: 'Identifying, prioritizing, and helping others meet their wants or needs with determination.' },
                { id: 'interpersonal-skills', name: 'Interpersonal Skills', description: 'Interacting effectively and building healthy relationships with others.' },
                { id: 'conflict-resolution', name: 'Conflict Resolution', description: 'Maintaining harmony within the team by mediating conflicts.' },
            ],
        },
        {
            id: 'self-management',
            name: 'Self-management and Self-knowledge',
            description: 'Questioning one\'s thoughts and actions in a deliberate and pertinent manner and knowing how to manage them appropriately.',
            competencies: [
                { id: 'respecting-instructions', name: 'Respecting Instructions', description: 'Adhering to procedures by following and implementing directives.' },
                { id: 'responsiveness', name: 'Responsiveness', description: 'Adjusting quickly to unexpected changes to plans and situations.' },
                { id: 'self-appraisal', name: 'Self-appraisal', description: 'Having a critical view of one\'s performance.' },
                { id: 'stress-management', name: 'Stress Management', description: 'Managing one\'s own emotions, and remaining calm and productive in challenging situations.' },
            ],
        },
        {
            id: 'values-integrity',
            name: 'Values and Integrity',
            description: 'Following principles and standards of ethical behavior, and thereby helping to create and maintain a positive work environment.',
            competencies: [
                { id: 'discretion', name: 'Discretion', description: 'Respecting confidentiality and exercising restraint in the disclosure of information.' },
                { id: 'impartiality', name: 'Impartiality', description: 'Treating people fairly and basing decisions on objective criteria.' },
                { id: 'modesty', name: 'Modesty', description: 'Being modest when it comes to estimating one\'s abilities and their worth.' },
                { id: 'respect', name: 'Respect', description: 'Behaving with regard to other\'s feelings, wishes, or rights.' },
                { id: 'openness-to-diversity', name: 'Openness to Diversity', description: 'Showing tolerance and acceptance of other people\'s ways of thinking, cultures, and values.' },
                { id: 'sense-of-duty', name: 'Sense of Duty', description: 'Respecting and adhering to codes of conduct, remaining honest, and being reliable.' },
            ],
        },
        {
            id: 'work-commitment',
            name: 'Work Commitment',
            description: 'Demonstrating sincere commitment to the company\'s goals with the overall aim of moving the company forward.',
            competencies: [
                { id: 'availability', name: 'Availability', description: 'Being committed to the organization and being willing to offer help whenever possible.' },
                { id: 'involvement', name: 'Involvement', description: 'Being highly committed and putting the maximum amount of energy and effort into achieving work-related objectives.' },
                { id: 'initiative', name: 'Initiative', description: 'Seizing opportunities and being a driving force to create or move things forward.' },
                { id: 'quality-orientation', name: 'Quality Orientation', description: 'To be meticulous with an eye for detail to ensure the highest level of quality and service.' },
                { id: 'striving', name: 'Striving', description: 'Constantly seeking to excel and surpass one\'s goal.' },
                { id: 'taking-responsibility', name: 'Taking Responsibility', description: 'Taking ownership of projects, and accepting the consequences of their success or failure.' },
            ],
        },
        {
            id: 'practical-skills',
            name: 'Practical Skills',
            description: 'Executing tasks that involve concrete results, whether this is working outdoors with objects or with technical equipment.',
            competencies: [
                { id: 'physical-technical-mindset', name: 'Physical/Technical Mindset', description: 'Using one\'s hand or tools, techniques, and machinery to perform day-to-day functions or solve problems with precision and dexterity.' },
                { id: 'physical-outdoor-endeavor', name: 'Physical/Outdoor Endeavor', description: 'Working in a demanding environment that requires physical effort, working outdoors, or moving around a lot.' },
            ],
        },
        {
            id: 'additional',
            name: 'Additional',
            description: 'Additional competencies relevant to the role.',
            competencies: [
                { id: 'adaptation-to-change', name: 'Adaptation to Change', description: 'Being able to adapt to change, adjusting one\'s behavior or attitude to an environment and people.' },
                { id: 'persistence', name: 'Persistence', description: 'Demonstrating determination and maintaining a high level of energy in the performance of duties.' },
            ],
        },
    ];
}
