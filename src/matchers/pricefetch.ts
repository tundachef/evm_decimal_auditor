
const TEN_POWERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const TEN_POWERS_HEX = new Set(
    TEN_POWERS.map(n => (BigInt(10) ** BigInt(n)).toString(16).padStart(16, '0'))
);

function isTenPower(hex: string): number | null {
    for (const pow of TEN_POWERS) {
        const hexPow = (BigInt(10) ** BigInt(pow)).toString(16);
        if (hex.includes(hexPow)) return pow;
    }
    return null;
}

export function findPriceFetchOpcodes(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const pcs: number[] = [];
    for (let i = 0; i < opcodes.length; i++) {
        if (['CALL', 'STATICCALL', 'DELEGATECALL'].includes(opcodes[i].name)) {
            let hasPush4 = false;
            let hasPush20 = false;
            for (let j = 1; j <= 5; j++) {
                const prev = opcodes[i - j];
                if (!prev) break;
                if (prev.name === 'PUSH4') hasPush4 = true;
                if (prev.name === 'PUSH20') hasPush20 = true;
            }
            if (hasPush4 && hasPush20) {
                pcs.push(opcodes[i].pc);
            }
        }
    }
    return pcs;
}

export function findDoubleScalingAfterPriceFetch(opcodes: { name: string; pc: number; pushData?: Buffer }[], fetchPCs: number[]): number[] {
    const matches: number[] = [];
    for (const pc of fetchPCs) {
        const i = opcodes.findIndex(op => op.pc === pc);
        let muls = 0;
        for (let j = 1; j <= 10; j++) {
            const next = opcodes[i + j];
            if (!next) break;
            if (next.name === 'MUL') muls++;
            if (next.name.startsWith('PUSH') && next.pushData) {
                const hex = next.pushData.toString('hex');
                if (TEN_POWERS_HEX.has(hex)) muls++;
            }
            if (muls >= 2) {
                matches.push(pc);
                break;
            }
        }
    }
    return matches;
}

export function findNoScalingAfterPriceFetch(opcodes: { name: string; pc: number; pushData?: Buffer }[], fetchPCs: number[]): number[] {
    const matches: number[] = [];
    for (const pc of fetchPCs) {
        const i = opcodes.findIndex(op => op.pc === pc);
        let scaled = false;
        for (let j = 1; j <= 10; j++) {
            const next = opcodes[i + j];
            if (!next) break;
            if (next.name.startsWith('PUSH') && next.pushData) {
                const hex = next.pushData.toString('hex');
                if (isTenPower(hex) !== null) {
                    scaled = true;
                    break;
                }
            }
        }
        if (!scaled) matches.push(pc);
    }
    return matches;
}

// Unchanged matchers for the rest:
export function findTruncatingIntegerDivision(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];
    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name === 'DIV') {
            let safe = false;
            for (let j = 1; j <= 3; j++) {
                if (opcodes[i - j]?.name === 'MUL') {
                    safe = true;
                    break;
                }
            }
            if (!safe) matches.push(opcodes[i].pc);
        }
    }
    return matches;
}

export function findInvertedPriceMath(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];
    for (let i = 0; i < opcodes.length; i++) {
        if (opcodes[i].name === 'DIV') {
            const prev = opcodes[i - 1];
            if (prev?.name?.startsWith('PUSH') && isTenPower(prev.pushData?.toString('hex') || '') !== null) {
                matches.push(opcodes[i].pc);
            }
        }
    }
    return matches;
}

export function findUncheckedOracleCall(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];
    for (let i = 0; i < opcodes.length; i++) {
        if (['CALL', 'STATICCALL'].includes(opcodes[i].name)) {
            let checked = false;
            for (let j = 1; j <= 5; j++) {
                if (['ISZERO', 'REVERT', 'JUMPI'].includes(opcodes[i + j]?.name)) {
                    checked = true;
                    break;
                }
            }
            if (!checked) matches.push(opcodes[i].pc);
        }
    }
    return matches;
}

export function findNoFreshnessCheck(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    return opcodes.filter((op, i) => op.name === 'PUSH4' && op.pushData?.toString('hex') === 'feaf968c')
        .map(op => op.pc);
}

export function findNoAnsweredInRoundCheck(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    return opcodes.filter((op, i) => op.name === 'PUSH4' && op.pushData?.toString('hex') === 'feaf968c')
        .map(op => op.pc);
}

export function findMismatchedSourcePriceMultiplication(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    return []; // Requires inter-call comparison and external analysis
}

export function findNoSanityBoundsOnPrice(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];
    for (let i = 0; i < opcodes.length; i++) {
        if (['CALL', 'STATICCALL'].includes(opcodes[i].name)) {
            let hasBounds = false;
            for (let j = 1; j <= 10; j++) {
                if (['GT', 'LT', 'JUMPI', 'REVERT'].includes(opcodes[i + j]?.name)) {
                    hasBounds = true;
                    break;
                }
            }
            if (!hasBounds) matches.push(opcodes[i].pc);
        }
    }
    return matches;
}

export function findWrongMathOrder(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    const matches: number[] = [];
    for (let i = 1; i < opcodes.length - 1; i++) {
        if (opcodes[i].name === 'DIV' && opcodes[i + 1].name === 'MUL') {
            matches.push(opcodes[i].pc);
        }
    }
    return matches;
}

export function findSpotPriceFromUniswapPair(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    return opcodes.filter((op) => op.name === 'PUSH4' && op.pushData?.toString('hex') === '0902f1ac')
        .map(op => op.pc);
}

export function findGetAmountsOutAbuse(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    return opcodes.filter((op) => op.name === 'PUSH4' && op.pushData?.toString('hex') === 'd06ca61f')
        .map(op => op.pc);
}

export function findLPBasedFakePricePath(opcodes: { name: string; pc: number; pushData?: Buffer }[]): number[] {
    return []; // Requires LP address heuristics or external call map
}
