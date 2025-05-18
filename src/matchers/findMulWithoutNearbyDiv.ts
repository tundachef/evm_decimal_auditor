/**
 * Detects MUL not followed or preceded by DIV within a window (likely scaled * scaled without descaling)
 */
export function findMulWithoutNearbyDiv(opcodes: { name: string; pc: number }[], windowSize: number = 5): number[] {
    const matches: number[] = [];

    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name !== 'MUL') continue;

        let hasDivNearby = false;

        // Look forward
        for (let j = 1; j <= windowSize; j++) {
            const next = opcodes[i + j];
            if (!next) break;
            if (next.name === 'DIV') {
                hasDivNearby = true;
                break;
            }
            if (next.name === 'MUL') break;
        }

        // Look backward
        if (!hasDivNearby) {
            for (let j = 1; j <= windowSize; j++) {
                const prev = opcodes[i - j];
                if (!prev) break;
                if (prev.name === 'DIV') {
                    hasDivNearby = true;
                    break;
                }
                if (prev.name === 'MUL') break;
            }
        }

        if (!hasDivNearby) {
            matches.push(opcodes[i].pc);
        }
    }

    return matches;
}
