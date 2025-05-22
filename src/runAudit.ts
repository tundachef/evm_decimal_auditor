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
    findPriceFetchingPatterns
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

    const collect = (type: string, pcs: number[]) => {
        for (const pc of pcs) {
            const i = opcodes.findIndex(op => op.pc === pc);
            let severity = "low";

            if (type === "Price fetch pattern") severity = "critical";
            else if (type === "DIV before MUL" || type === "External token no scaling") severity = "medium";

            results.issues.push({ type, pc, context: context(i), severity });
        }
    };

    // Run all matchers
    collect("DIV before MUL", findDivBeforeMul(opcodes));
    collect("Missing DIV after MUL", findMissingDivAfterMul(opcodes));
    collect("Double MUL without descaling", findDoubleMulNoDescale(opcodes));
    collect("Rounding loss in DIV", findRoundingLossInDiv(opcodes));
    collect("External token no scaling", findExternalTokenNoScaling(opcodes));
    collect("MUL with no nearby DIV", findMulWithoutNearbyDiv(opcodes));
    collect("MUL with scale constant but no DIV", findMulWithScaleButNoDivAfter(opcodes));
    collect("Price fetch pattern", findPriceFetchingPatterns(opcodes)); // Only this is critical

    // Send email if critical price-fetch pattern is found
    const criticalFinds = results.issues.filter(issue => issue.type === "Price fetch pattern");

    if (criticalFinds.length > 0) {
        const subject = `Critical: Price Fetch Detected in ${address}`;
        const text = criticalFinds.map(issue =>
            `[${issue.type}] at PC ${issue.pc}\nContext: ${issue.context.join(" ")}`
        ).join("\n\n");

        await sendEmail(subject, text);

        fs.mkdirSync("./audits", { recursive: true });
        const critLogPath = "./audits/critical-issues.json";

        let prev = [];
        if (fs.existsSync(critLogPath)) {
            try {
                prev = JSON.parse(fs.readFileSync(critLogPath, "utf-8"));
            } catch { }
        }

        const entry = {
            address,
            count: criticalFinds.length,
            issues: criticalFinds.map(issue => ({
                type: issue.type,
                pc: issue.pc,
                context: issue.context
            }))
        };

        prev.push(entry);
        fs.writeFileSync(critLogPath, JSON.stringify(prev, null, 2));
        console.log(chalk.red(`🔴 Logged ${criticalFinds.length} critical price fetch issues to ${critLogPath}`));
    }

    // Output full JSON audit if needed
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
