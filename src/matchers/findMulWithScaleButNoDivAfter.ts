export function findMulWithScaleButNoDivAfter(
    opcodes: { name: string; pc: number; pushData?: Buffer }[],
    windowSize: number = 5
): number[] {
    const matches: number[] = [];
    const TEN_POWERS = [3, 6, 9, 12, 15, 18, 21].map(n => BigInt(10) ** BigInt(n));

    for (let i = 0; i < opcodes.length; i++) {
        const opcode = opcodes[i];
        if (opcode.name !== 'MUL') continue;

        const prev1 = opcodes[i - 1];
        const prev2 = opcodes[i - 2];
        const operands = [prev1, prev2].filter(Boolean);

        const scaleUsed = operands.some(op =>
            TEN_POWERS.some(power => {
                if (!op.pushData) return false;
                const val = BigInt('0x' + op.pushData.toString('hex'));
                const isMatch = val === power;
                if (isMatch) {
                    console.log(`📏 Found scaling MUL with 10^x: ${val} at PC ${op.pc} before MUL at PC ${opcode.pc}`);
                }
                return isMatch;
            })
        );

        if (!scaleUsed) continue;

        // Look ahead for DIV within window
        let hasDiv = false;
        for (let j = 1; j <= windowSize; j++) {
            const next = opcodes[i + j];
            if (!next) break;
            if (next.name === 'DIV') {
                hasDiv = true;
                break;
            }
        }

        if (!hasDiv) {
            matches.push(opcode.pc);
        }
    }

    return matches;
}
