/**
 * Detects DIV followed by MUL within a short range of instructions.
 * This usually means: (a / b) * c, which leads to precision loss.
 */

export function findDivBeforeMul(opcodes: string[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].startsWith('DIV')) {
            // Look ahead up to 5 instructions
            for (let j = 1; j <= 5; j++) {
                const next = opcodes[i + j];
                if (!next) break;
                if (next.startsWith('MUL')) {
                    matches.push(i);
                    break;
                }
                // If you hit a new DIV or STOP/RETURN in between, break early
                if (next.startsWith('DIV') || next.startsWith('STOP') || next.startsWith('RETURN')) {
                    break;
                }
            }
        }
    }

    return matches;
}
