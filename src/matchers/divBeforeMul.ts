/**
 * Detects DIV followed by MUL within a short range of instructions.
 * This usually means: (a / b) * c, which leads to precision loss.
 */
export function findDivBeforeMul(opcodes: { name: string }[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name === 'DIV') {
            for (let j = 1; j <= 5; j++) {
                const next = opcodes[i + j];
                if (!next) break;
                if (next.name === 'MUL') {
                    matches.push(i);
                    break;
                }
                if (next.name === 'DIV' || next.name === 'STOP' || next.name === 'RETURN') {
                    break;
                }
            }
        }
    }

    return matches;
}
