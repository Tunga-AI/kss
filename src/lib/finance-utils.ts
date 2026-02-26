
import type { Transaction } from './transactions-types';
import type { Program } from './program-types';

export interface ProgramFinanceStatus {
    programName: string;
    programId?: string;
    totalPaid: number;
    programFee: number;    // Base tuition price  (program.price)
    admissionFee: number;  // Non-refundable application fee (program.admissionCost)
    totalCost: number;     // programFee + admissionFee
    balance: number;       // totalCost - totalPaid
    currency: string;
    status: 'Fully Paid' | 'Partially Paid' | 'Overpaid' | 'No Payment';
    transactions: Transaction[];
}

/**
 * Safely parse a price value that may be a number, a number-string, or
 * a formatted string like "KES 104,400".
 */
export const parsePrice = (priceStr?: string | number | null): number => {
    if (priceStr === undefined || priceStr === null || priceStr === '') return 0;
    if (typeof priceStr === 'number') return isNaN(priceStr) ? 0 : priceStr;
    // Remove currency symbols, spaces, commas then parse
    const clean = priceStr.toString().replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
};

/**
 * Match a transaction's program name against the programs collection.
 *
 * Programs are saved with the canonical field `programName`.
 * The `title` field is an optional legacy alias — we check both.
 * The transaction stores the program name in `tx.program`.
 */
const findProgram = (txProgram: string, programs: Program[]): Program | undefined => {
    const needle = txProgram.trim().toLowerCase();
    return programs.find(p => {
        const name = (p.programName || p.title || '').trim().toLowerCase();
        return name === needle;
    });
};

/**
 * Group transactions by program name and merge with fee data from
 * the programs collection to calculate the financial status of each program.
 *
 * Fee fields used from the Program document:
 *   - `price`          → tuition / program fee  (number)
 *   - `admissionCost`  → non-refundable application/registration fee  (number)
 *   - `currency`       → ISO currency code  (string, default 'KSH')
 */
export const calculateProgramFinances = (
    transactions: Transaction[],
    programs: Program[]
): ProgramFinanceStatus[] => {
    const financeMap = new Map<string, ProgramFinanceStatus>();

    transactions.forEach(tx => {
        if (!tx.program) return;

        if (!financeMap.has(tx.program)) {
            const prog = findProgram(tx.program, programs);

            // Tuition: stored as `price` (number) in the programs collection
            const programFee = parsePrice(prog?.price);

            // Admission: stored as `admissionCost` (number) in the programs collection.
            // Fall back to the legacy `registrationFee` field for any older documents.
            const admissionFee = parsePrice(
                prog?.admissionCost ?? (prog as any)?.registrationFee
            );

            const totalCost = programFee + admissionFee;

            financeMap.set(tx.program, {
                programName: tx.program,
                programId: prog?.id,
                totalPaid: 0,
                programFee,
                admissionFee,
                totalCost,
                balance: totalCost,
                currency: prog?.currency || tx.currency || 'KSH',
                status: 'No Payment',
                transactions: [],
            });
        }

        const entry = financeMap.get(tx.program)!;

        // If program data wasn't resolved initially, try again
        if (!entry.programId) {
            const prog = findProgram(tx.program, programs);
            if (prog) {
                entry.programId = prog.id;
                entry.programFee = parsePrice(prog.price);
                entry.admissionFee = parsePrice(
                    prog.admissionCost ?? (prog as any).registrationFee
                );
                entry.totalCost = entry.programFee + entry.admissionFee;
                entry.currency = prog.currency || entry.currency;
            }
        }

        entry.transactions.push(tx);

        if (tx.status === 'Success') {
            entry.totalPaid += tx.amount;
        }
    });

    // Calculate final balances and statuses
    return Array.from(financeMap.values()).map(entry => {
        const balance = entry.totalCost - entry.totalPaid;

        let status: ProgramFinanceStatus['status'] = 'No Payment';

        if (entry.totalCost > 0) {
            if (balance < 0) {
                status = 'Overpaid';
            } else if (balance === 0) {
                status = 'Fully Paid';
            } else {
                // balance > 0
                status = entry.totalPaid > 0 ? 'Partially Paid' : 'No Payment';
            }
        } else {
            // Free program (price = 0, admissionCost = 0)
            status = entry.totalPaid > 0 ? 'Overpaid' : 'Fully Paid';
        }

        return { ...entry, balance, status };
    });
};
