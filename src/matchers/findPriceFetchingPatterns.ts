export function findPriceFetchingPatterns(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];

    const TEN_POWERS_HEX = new Set(
        [3, 6, 9, 12, 15, 18, 21]
            .map(n => (BigInt(10) ** BigInt(n)).toString(16).padStart(16, '0'))
    );

    for (let i = 0; i < opcodes.length; i++) {
        const opcode = opcodes[i];

        if (opcode.name !== 'CALL' && opcode.name !== 'STATICCALL' && opcode.name !== 'DELEGATECALL') {
            continue;
        }

        let hasPush4 = false;
        let hasPush20 = false;
        let hasRetCopyOrLoad = false;
        let hasMathScaling = false;

        // Look back: PUSH4 (selector), PUSH20 (external address)
        for (let j = 1; j <= 5; j++) {
            const prev = opcodes[i - j];
            if (!prev) break;
            if (prev.name === 'PUSH4') hasPush4 = true;
            if (prev.name === 'PUSH20') hasPush20 = true;
        }

        // Look forward: RETURNDATA ops, math, decimal scaling
        for (let j = 1; j <= 10; j++) {
            const next = opcodes[i + j];
            if (!next) break;

            if (
                next.name === 'RETURNDATACOPY' ||
                next.name === 'RETURNDATASIZE' ||
                next.name === 'MLOAD'
            ) {
                hasRetCopyOrLoad = true;
            }

            if (
                next.name === 'MUL' ||
                next.name === 'DIV' ||
                next.name === 'SHL' ||
                next.name === 'SHR'
            ) {
                hasMathScaling = true;
            }

            // Check if any PUSH includes a known 10^n constant
            if (next.name.startsWith('PUSH') && next.pushData) {
                const hex = next.pushData.toString('hex').replace(/^0+/, '').toLowerCase(); // strip leading zeros
                for (const tenHex of TEN_POWERS_HEX) {
                    if (hex.includes(tenHex)) {
                        hasMathScaling = true;
                        break;
                    }
                }
            }
        }

        if (hasPush4 && hasPush20 && hasRetCopyOrLoad && hasMathScaling) {
            matches.push(opcode.pc);
        }
    }

    return matches;
}
