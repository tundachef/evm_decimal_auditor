import { findMulWithScaleButNoDivAfter } from "../src/matchers";

const sampleOpcodes = [
    { name: "PUSH32", pc: 0, pushData: Buffer.from("00000000000000000000000000000000000000000000000000000000000003E8", "hex") }, // 1000
    { name: "PUSH1", pc: 1 }, // Simulate another operand
    { name: "MUL", pc: 2 },
    { name: "SWAP1", pc: 3 },
    { name: "ADD", pc: 4 },
    // No DIV following
];

const result = findMulWithScaleButNoDivAfter(sampleOpcodes);
console.log("🚨 PC Matches without nearby DIV:", result);
