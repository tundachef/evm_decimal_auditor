/**
 * Detects DIV operations not preceded by ADD or PUSH (b/2) style rounding.
 */
export function findRoundingLossInDiv(opcodes: { name: string; pc: number }[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name === 'DIV') {
            const prev1 = opcodes[i - 1]?.name || '';
            const prev2 = opcodes[i - 2]?.name || '';

            if (prev1 !== 'ADD' && prev2 !== 'ADD') {
                matches.push(opcodes[i].pc);
            }
        }
    }

    return matches;
}
