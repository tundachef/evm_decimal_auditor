/**
 * Detects two MUL operations within short range with no DIV (10^18) in between.
 */
export function findDoubleMulNoDescale(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length - 1; i++) {
        if (opcodes[i].name === 'MUL') {
            for (let j = 1; j <= 10; j++) {
                const next = opcodes[i + j];
                if (!next) break;

                if (next.name === 'MUL') {
                    // Look for DIV or PUSH with 10^18 in between
                    let hasDivOrScale = false;
                    for (let k = 1; k < j; k++) {
                        const mid = opcodes[i + k];
                        if (mid.name === 'DIV') {
                            hasDivOrScale = true;
                            break;
                        }
                        if (
                            mid.name.startsWith('PUSH') &&
                            mid.pushData?.toString('hex').includes('de0b6b3a7640000') // 10^18 in hex
                        ) {
                            hasDivOrScale = true;
                            break;
                        }
                    }

                    if (!hasDivOrScale) matches.push(opcodes[i].pc);
                    break;
                }
            }
        }
    }

    return matches;
}
