import chalk from "chalk";
import {
    findDivBeforeMul,
    findMissingDivAfterMul,
    findDoubleMulNoDescale,
    findRoundingLossInDiv,
    findExternalTokenNoScaling,
    findMulWithoutNearbyDiv,
    findMulWithScaleButNoDivAfter
} from "./matchers";
import { disassembleContract } from "./utils/disassemble";
import { sendEmail } from "./utils/email";
import fs from "fs";
import { getInterestingTokenAddresses } from "./eth-uniswap-latest-pairs";
import { runAudit } from "./runAudit";

// ✅ Tracks audited tokens across cycles
const auditedTokens = new Set<string>();

async function runScanner() {
    console.log(`\n⏱️  [${new Date().toISOString()}] Starting token audit loop...`);

    const tokens = await getInterestingTokenAddresses(50);
    console.log(`✅ Retrieved ${tokens.length} candidate token addresses.`);

    let newAudits = 0;

    for (const token of tokens) {
        const tokenLower = token.toLowerCase();

        if (auditedTokens.has(tokenLower)) {
            console.log(`⏭️  Skipping already audited: ${tokenLower}`);
            continue;
        }

        try {
            console.log(`🔍 Auditing token: ${tokenLower}`);
            await runAudit(tokenLower);
            auditedTokens.add(tokenLower);
            newAudits++;
        } catch (err) {
            console.error(`❌ Audit failed for ${tokenLower}:`, err);
        }
    }

    console.log(`✅ Completed ${newAudits} new audits.`);
}

// Run immediately once
runScanner();

// Repeat every 30 minutes
setInterval(runScanner, 30 * 60 * 1000);
