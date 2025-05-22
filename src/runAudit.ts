import chalk from "chalk";
import fs from "fs";
import {
    findDivBeforeMul,
    findMissingDivAfterMul,
    findDoubleMulNoDescale,
    findRoundingLossInDiv,
    findExternalTokenNoScaling,
    findMulWithoutNearbyDiv,
    findMulWithScaleButNoDivAfter,
    findPriceFetchingPatterns,
    findPriceFetchOpcodes,
    findDoubleScalingAfterPriceFetch,
    findNoScalingAfterPriceFetch,
    findTruncatingIntegerDivision,
    findInvertedPriceMath,
    findUncheckedOracleCall,
    findNoFreshnessCheck,
    findNoAnsweredInRoundCheck,
    findNoSanityBoundsOnPrice,
    findWrongMathOrder,
    findSpotPriceFromUniswapPair,
    findGetAmountsOutAbuse,
    findLPBasedFakePricePath
} from "./matchers";
import { disassembleContract } from "./utils/disassemble";
import { sendEmail } from "./utils/email";

export async function runAudit(address: string, outputJson: boolean = true) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        console.log(chalk.red("❌ Invalid contract address provided."));
        process.exit(1);
    }

    const opcodes = await disassembleContract(address);
    if (!opcodes || opcodes.length === 0) {
        console.log(chalk.red("❌ No opcodes found."));
        return;
    }

    const results = {
        contract: address,
        issues: [] as { type: string; pc: number; context: string[]; severity: string }[]
    };

    const context = (index: number) =>
        opcodes.slice(Math.max(0, index - 3), index + 4).map(op => op.name);

    const collect = (type: string, pcs: number[], severity: string = "low") => {
        for (const pc of pcs) {
            const i = opcodes.findIndex(op => op.pc === pc);
            results.issues.push({ type, pc, context: context(i), severity });
        }
    };

    // === General matchers ===
    collect("DIV before MUL", findDivBeforeMul(opcodes), "medium");
    collect("Missing DIV after MUL", findMissingDivAfterMul(opcodes), "high");
    collect("Double MUL without descaling", findDoubleMulNoDescale(opcodes), "high");
    collect("Rounding loss in DIV", findRoundingLossInDiv(opcodes), "low");
    collect("External token no scaling", findExternalTokenNoScaling(opcodes), "medium");
    collect("MUL with no nearby DIV", findMulWithoutNearbyDiv(opcodes), "critical");
    collect("MUL with scale constant but no DIV", findMulWithScaleButNoDivAfter(opcodes), "critical");
    collect("Price fetch pattern", findPriceFetchingPatterns(opcodes), "critical");

    // === Advanced matchers (only after finding fetch) ===
    const fetchPCs = findPriceFetchOpcodes(opcodes);
    if (fetchPCs.length > 0) {
        collect("Double scaling after price fetch", findDoubleScalingAfterPriceFetch(opcodes, fetchPCs), "exploit");
        collect("No scaling after price fetch", findNoScalingAfterPriceFetch(opcodes, fetchPCs), "exploit");
        collect("Truncating integer division", findTruncatingIntegerDivision(opcodes), "exploit");
        collect("Inverted price math", findInvertedPriceMath(opcodes), "exploit");
        collect("Unchecked oracle call", findUncheckedOracleCall(opcodes), "exploit");
        collect("No freshness check", findNoFreshnessCheck(opcodes), "exploit");
        collect("No answeredInRound check", findNoAnsweredInRoundCheck(opcodes), "exploit");
        collect("No sanity bounds on price", findNoSanityBoundsOnPrice(opcodes), "exploit");
        collect("Wrong math order", findWrongMathOrder(opcodes), "exploit");
        collect("Spot price from Uniswap", findSpotPriceFromUniswapPair(opcodes), "exploit");
        collect("getAmountsOut abuse", findGetAmountsOutAbuse(opcodes), "exploit");
        collect("LP-based fake price path", findLPBasedFakePricePath(opcodes), "exploit");
    } else {
        console.log(chalk.green("✅ No price fetch logic detected — advanced matchers skipped."));
    }

    const exploitFinds = results.issues.filter(issue => issue.severity === "exploit");

    if (exploitFinds.length > 0) {
        const subject = `🚨 Exploit Risk Detected in ${address}`;
        const text = exploitFinds.map(issue =>
            `[${issue.type}] at PC ${issue.pc}\nContext: ${issue.context.join(" ")}`
        ).join("\n\n");

        try {
            await sendEmail(subject, text);
            console.log(chalk.blue(`📧 Exploit alert email sent for ${address}`));
        } catch (err) {
            console.error(chalk.red(`❌ Failed to send email: ${err}`));
        }

        const exploitLogPath = "./audits/exploit-issues.json";
        let previous = [];

        try {
            if (fs.existsSync(exploitLogPath)) {
                previous = JSON.parse(fs.readFileSync(exploitLogPath, "utf-8"));
            }
        } catch (err) {
            console.error(chalk.red("❌ Failed to read existing exploit log."), err);
        }

        const entry = {
            address,
            count: exploitFinds.length,
            issues: exploitFinds.map(issue => ({
                type: issue.type,
                pc: issue.pc,
                context: issue.context
            }))
        };

        try {
            previous.push(entry);
            fs.writeFileSync(exploitLogPath, JSON.stringify(previous, null, 2));
            console.log(chalk.red(`🔴 Logged ${exploitFinds.length} exploit-level issues to ${exploitLogPath}`));
        } catch (err) {
            console.error(chalk.red("❌ Failed to write exploit issues to log file."), err);
        }
    }

    if (outputJson) {
        const outputFile = `./audits/audit-${address}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
        console.log(chalk.green(`✅ JSON audit saved to ${outputFile}`));
    } else {
        if (results.issues.length === 0) {
            console.log(chalk.green("✅ No issues found."));
        } else {
            console.log(chalk.red(`\n⚠️  ${results.issues.length} issues found:`));
            for (const issue of results.issues) {
                console.log(chalk.yellow(`\n[${issue.type}] at PC ${issue.pc}`));
                console.log("  Context:", issue.context.join(" "));
            }
        }
    }
}
