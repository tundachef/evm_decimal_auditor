import { ethers } from "ethers";
import { provider } from "./helpers/constants";


const V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const V2_FACTORY_ABI = [
    "function allPairsLength() external view returns (uint256)",
    "function allPairs(uint256) external view returns (address)"
];

const PAIR_ABI = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function getReserves() view returns (uint112,uint112,uint32)"
];

const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function name() view returns (string)",
];

const EXCLUDED_SYMBOLS = ["WETH", "USDC", "USDT", "DAI", "WBTC"];

/**
 * Get unique token addresses from latest Uniswap V2 pairs, excluding known stable/major tokens
 */
export async function getInterestingTokenAddresses(limitPairs = 100): Promise<string[]> {
    const factory = new ethers.Contract(V2_FACTORY, V2_FACTORY_ABI, provider);
    const total = await factory.allPairsLength();

    const tokenAddresses = new Set<string>();

    for (let i = Number(total) - 1; i >= 0 && tokenAddresses.size < limitPairs; i--) {
        try {
            const pairAddr = await factory.allPairs(i);
            const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);

            const [token0Addr, token1Addr] = await Promise.all([
                pair.token0(),
                pair.token1()
            ]);

            const token0 = new ethers.Contract(token0Addr, ERC20_ABI, provider);
            const token1 = new ethers.Contract(token1Addr, ERC20_ABI, provider);

            const [symbol0, symbol1] = await Promise.all([
                token0.symbol(),
                token1.symbol()
            ]);

            if (!EXCLUDED_SYMBOLS.includes(symbol0)) tokenAddresses.add(token0Addr.toLowerCase());
            if (!EXCLUDED_SYMBOLS.includes(symbol1)) tokenAddresses.add(token1Addr.toLowerCase());

        } catch (err) {
            // ignore broken or nonstandard pairs
        }
    }

    return Array.from(tokenAddresses);
}

// (async () => {
//     const tokens = await getInterestingTokenAddresses(10); // scan ~200 latest pairs
//     console.log(`✅ Unique non-excluded token addresses: ${tokens.length}`);
//     console.dir(tokens, { maxArrayLength: null });
// })();