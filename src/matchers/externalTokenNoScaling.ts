/**
 * Detects CALL followed by balanceOf usage without scaling logic
 */
export function findExternalTokenNoScaling(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name === 'CALL') {
            let foundBalanceLogic = false;
            let hasScaling = false;

            for (let j = 1; j <= 10; j++) {
                const next = opcodes[i + j];
                if (!next) break;

                if (next.name === 'SLOAD' || next.name === 'CALLDATALOAD') {
                    foundBalanceLogic = true;
                }

                if (
                    next.name === 'DIV' ||
                    next.name === 'MUL' ||
                    (next.name.startsWith('PUSH') &&
                        next.pushData?.toString('hex').includes('de0b6b3a7640000'))
                ) {
                    hasScaling = true;
                    break;
                }
            }

            if (foundBalanceLogic && !hasScaling) {
                matches.push(opcodes[i].pc);
            }
        }
    }

    return matches;
}
