/**
 * Detects MUL not followed by DIV within next N ops (likely scaled * scaled without descaling)
 */
export function findMissingDivAfterMul(opcodes: { name: string; pc: number }[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name === 'MUL') {
            let foundDiv = false;

            for (let j = 1; j <= 5; j++) {
                const next = opcodes[i + j];
                if (!next) break;
                if (next.name === 'DIV') {
                    foundDiv = true;
                    break;
                }
                if (next.name === 'MUL') break;
            }

            if (!foundDiv) {
                matches.push(opcodes[i].pc);
            }
        }
    }

    return matches;
}
