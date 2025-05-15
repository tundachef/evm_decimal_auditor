// tests/matchers.spec.ts

import { findDivBeforeMul, findMissingDivAfterMul, findDoubleMulNoDescale, findRoundingLossInDiv, findExternalTokenNoScaling } from "../matchers";

// ts-node matchers.spec.ts >> output.log 2>&1

function fakeOp(name: string, pc: number, pushData?: string) {
    return {
        name,
        pc,
        pushData: pushData ? Buffer.from(pushData, 'hex') : undefined
    };
}

// Test sequences for each matcher
const tests = {
    divBeforeMul: {
        vulnerable: [fakeOp("DIV", 0), fakeOp("PUSH1", 1), fakeOp("MUL", 2)],
        safe: [fakeOp("PUSH1", 0), fakeOp("MUL", 1), fakeOp("DIV", 2)]
    },
    missingDivAfterMul: {
        vulnerable: [fakeOp("MUL", 0), fakeOp("ADD", 1)],
        safe: [fakeOp("MUL", 0), fakeOp("DIV", 1)]
    },
    doubleMulNoDescale: {
        vulnerable: [fakeOp("MUL", 0), fakeOp("PUSH1", 1), fakeOp("MUL", 2)],
        safe: [fakeOp("MUL", 0), fakeOp("PUSH32", 1, "de0b6b3a7640000"), fakeOp("DIV", 2)]
    },
    roundingLossInDiv: {
        vulnerable: [fakeOp("PUSH1", 0), fakeOp("PUSH1", 1), fakeOp("DIV", 2)],
        safe: [fakeOp("PUSH1", 0), fakeOp("ADD", 1), fakeOp("DIV", 2)]
    },
    externalTokenNoScaling: {
        vulnerable: [fakeOp("CALL", 0), fakeOp("CALLDATALOAD", 1)],
        safe: [
            fakeOp("CALL", 0),
            fakeOp("CALLDATALOAD", 1),
            fakeOp("PUSH32", 2, "de0b6b3a7640000"),
            fakeOp("DIV", 3)
        ]
    }
};

console.log("\n✅ Matcher Unit Test Results\n============================");

console.log("DIV before MUL:");
console.log("  vulnerable:", findDivBeforeMul(tests.divBeforeMul.vulnerable));
console.log("  safe:", findDivBeforeMul(tests.divBeforeMul.safe));

console.log("\nMissing DIV after MUL:");
console.log("  vulnerable:", findMissingDivAfterMul(tests.missingDivAfterMul.vulnerable));
console.log("  safe:", findMissingDivAfterMul(tests.missingDivAfterMul.safe));

console.log("\nDouble MUL without descaling:");
console.log("  vulnerable:", findDoubleMulNoDescale(tests.doubleMulNoDescale.vulnerable));
console.log("  safe:", findDoubleMulNoDescale(tests.doubleMulNoDescale.safe));

console.log("\nRounding loss in DIV:");
console.log("  vulnerable:", findRoundingLossInDiv(tests.roundingLossInDiv.vulnerable));
console.log("  safe:", findRoundingLossInDiv(tests.roundingLossInDiv.safe));

console.log("\nExternal token no scaling:");
console.log("  vulnerable:", findExternalTokenNoScaling(tests.externalTokenNoScaling.vulnerable));
console.log("  safe:", findExternalTokenNoScaling(tests.externalTokenNoScaling.safe));
