/**
 * Detects MUL not followed by DIV within next N ops (likely scaled * scaled without descaling)
 */
export function findMissingDivAfterMul(opcodes: string[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].startsWith("MUL")) {
            let foundDiv = false;

            for (let j = 1; j <= 5; j++) {
                const next = opcodes[i + j];
                if (!next) break;
                if (next.startsWith("DIV")) {
                    foundDiv = true;
                    break;
                }
                // If another MUL shows up before DIV, ignore
                if (next.startsWith("MUL")) break;
            }

            if (!foundDiv) {
                matches.push(i);
            }
        }
    }

    return matches;
}
