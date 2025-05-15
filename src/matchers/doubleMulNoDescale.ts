/**
 * Detects two MUL operations within short range with no DIV (10^18) in between.
 */
export function findDoubleMulNoDescale(opcodes: string[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length - 1; i++) {
        if (opcodes[i].startsWith("MUL")) {
            for (let j = 1; j <= 10; j++) {
                const next = opcodes[i + j];
                if (!next) break;

                if (next.startsWith("MUL")) {
                    // Look for DIV or scaling (like PUSH 0xDE0B6B3A7640000) in-between
                    let hasDivOrScale = false;
                    for (let k = 1; k < j; k++) {
                        const mid = opcodes[i + k];
                        if (mid.startsWith("DIV") || mid.includes("DE0B6B3A7640000")) {
                            hasDivOrScale = true;
                            break;
                        }
                    }

                    if (!hasDivOrScale) matches.push(i);
                    break;
                }
            }
        }
    }

    return matches;
}
