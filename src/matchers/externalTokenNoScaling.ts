/**
 * Detects CALL followed by balanceOf usage without scaling logic
 */
export function findExternalTokenNoScaling(opcodes: string[]): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].startsWith("CALL")) {
            let foundBalanceLogic = false;
            let hasScaling = false;

            for (let j = 1; j <= 10; j++) {
                const next = opcodes[i + j];
                if (!next) break;

                if (next.startsWith("SLOAD") || next.includes("balance")) {
                    foundBalanceLogic = true;
                }

                if (next.includes("DE0B6B3A7640000") || next.startsWith("MUL") || next.startsWith("DIV")) {
                    hasScaling = true;
                    break;
                }
            }

            if (foundBalanceLogic && !hasScaling) {
                matches.push(i);
            }
        }
    }

    return matches;
}
