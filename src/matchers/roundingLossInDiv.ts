/**
 * Detects DIV operations not preceded by ADD or PUSH (b/2) style rounding.
 */
export function findRoundingLossInDiv(opcodes: string[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].startsWith("DIV")) {
            let safe = false;

            // Check if the previous 2 ops are an ADD and a PUSH (implied rounding logic)
            const prev1 = opcodes[i - 1] || "";
            const prev2 = opcodes[i - 2] || "";

            if (prev1.startsWith("ADD") || prev2.startsWith("ADD")) {
                safe = true;
            }

            if (!safe) {
                matches.push(i);
            }
        }
    }

    return matches;
}
