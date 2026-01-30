export type Cohort = {
    id: string;
    name: string;
    status: 'Accepting Applications' | 'In Review' | 'Closed';
    council: string[]; // Array of facilitator user IDs
};
