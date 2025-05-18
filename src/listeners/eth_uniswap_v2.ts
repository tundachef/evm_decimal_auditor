import { ethers } from "ethers";
import { provider } from "../helpers/constants";


// Uniswap V2 Factory address and ABI
const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const ABI = [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

const factory = new ethers.Contract(UNISWAP_V2_FACTORY, ABI, provider);

// Listen for new PairCreated events
factory.on("PairCreated", (token0, token1, pairAddress, allPairsLength) => {
    console.log("New Uniswap V2 Pool Created:");
    console.log(`- Token0: ${token0}`);
    console.log(`- Token1: ${token1}`);
    console.log(`- Pair:   ${pairAddress}`);
    console.log(`- Total Pairs: ${allPairsLength}`);
});
