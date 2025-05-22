// matcher-tests.ts

import {
    findPriceFetchOpcodes,
    findDoubleScalingAfterPriceFetch,
    findNoScalingAfterPriceFetch,
    findTruncatingIntegerDivision,
    findInvertedPriceMath,
    findUncheckedOracleCall,
    findNoFreshnessCheck,
    findNoAnsweredInRoundCheck,
    findMismatchedSourcePriceMultiplication,
    findNoSanityBoundsOnPrice,
    findWrongMathOrder,
    findSpotPriceFromUniswapPair,
    findGetAmountsOutAbuse,
    findLPBasedFakePricePath
} from "../src/matchers";

const exampleOpcodes: { name: string; pc: number; pushData?: Buffer }[] = [
    { name: "PUSH20", pc: 0 },
    { name: "PUSH4", pc: 1, pushData: Buffer.from("feaf968c", "hex") },
    { name: "STATICCALL", pc: 2 },
    { name: "RETURNDATACOPY", pc: 3 },
    { name: "MLOAD", pc: 4 },
    { name: "PUSH32", pc: 5, pushData: Buffer.from("0000000000000000000000000000000000000000000000000de0b6b3a7640000", "hex") },
    { name: "MUL", pc: 6 },
    { name: "MUL", pc: 7 },
    { name: "DIV", pc: 8 },
    { name: "REVERT", pc: 9 },
    { name: "PUSH4", pc: 10, pushData: Buffer.from("0902f1ac", "hex") },
    { name: "CALL", pc: 11 },
    { name: "PUSH4", pc: 12, pushData: Buffer.from("d06ca61f", "hex") },
    { name: "CALL", pc: 13 }
];

const fetchPCs = findPriceFetchOpcodes(exampleOpcodes);

console.log("✅ Price fetch detected at PCs:", fetchPCs);
console.log("🔁 Double Scaling:", findDoubleScalingAfterPriceFetch(exampleOpcodes, fetchPCs));
console.log("🟡 No Scaling:", findNoScalingAfterPriceFetch(exampleOpcodes, fetchPCs));
console.log("🧮 Truncating Integer DIV:", findTruncatingIntegerDivision(exampleOpcodes));
console.log("↕️ Inverted Price Math:", findInvertedPriceMath(exampleOpcodes));
console.log("⚠️ Unchecked Oracle Calls:", findUncheckedOracleCall(exampleOpcodes));
console.log("⏳ No Freshness Check:", findNoFreshnessCheck(exampleOpcodes));
console.log("🔁 No Answered-In-Round Check:", findNoAnsweredInRoundCheck(exampleOpcodes));
console.log("📉 No Sanity Bounds:", findNoSanityBoundsOnPrice(exampleOpcodes));
console.log("🔀 Wrong Math Order:", findWrongMathOrder(exampleOpcodes));
console.log("🧪 Spot Price from Uniswap:", findSpotPriceFromUniswapPair(exampleOpcodes));
console.log("🛣️ getAmountsOut Abuse:", findGetAmountsOutAbuse(exampleOpcodes));
console.log("👻 LP Price Fakes:", findLPBasedFakePricePath(exampleOpcodes));
