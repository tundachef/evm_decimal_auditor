import chalk from "chalk";
import fs from "fs";
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
            if (type === "Missing DIV after MUL" || type === "Double MUL without descaling") severity = "high";
            else if (type === "DIV before MUL" || type === "External token no scaling") severity = "medium";
            else if (
                type === "MUL with no nearby DIV" ||
                type === "MUL with scale constant but no DIV"
            ) severity = "critical";

            results.issues.push({ type, pc, context: context(i), severity });
        }
    };

    collect("DIV before MUL", findDivBeforeMul(opcodes));
    collect("Missing DIV after MUL", findMissingDivAfterMul(opcodes));
    collect("Double MUL without descaling", findDoubleMulNoDescale(opcodes));
    collect("Rounding loss in DIV", findRoundingLossInDiv(opcodes));
    collect("External token no scaling", findExternalTokenNoScaling(opcodes));
    collect("MUL with no nearby DIV", findMulWithoutNearbyDiv(opcodes));
    collect("MUL with scale constant but no DIV", findMulWithScaleButNoDivAfter(opcodes));

    const criticalIssues = results.issues.filter(issue => issue.severity === "critical");

    if (criticalIssues.length > 0) {
        const subject = `Critical Audit Alert: ${address}`;
        const text = criticalIssues.map(issue =>
            `[${issue.type}] at PC ${issue.pc}\nContext: ${issue.context.join(" ")}`
        ).join("\n\n");

        await sendEmail(subject, text);
    }

    if (outputJson) {
        fs.mkdirSync("./audits", { recursive: true });
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
