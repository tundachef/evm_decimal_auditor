
import chalk from "chalk";
import { findDivBeforeMul, findMissingDivAfterMul, findDoubleMulNoDescale, findRoundingLossInDiv, findExternalTokenNoScaling } from "./matchers";
import { disassembleContract } from "./utils/disassemble";

const [, , address] = process.argv;

if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.log(chalk.red("Usage: ts-node index.ts <valid_contract_address>"));
    process.exit(1);
}

(async () => {
    console.log(chalk.cyan(`📦 Disassembling contract at ${address}...`));
    const opcodes = await disassembleContract(address);

    if (!opcodes || opcodes.length === 0) {
        console.log(chalk.red("❌ Failed to get opcodes."));
        return;
    }

    console.log(chalk.yellow(`🔍 Running decimal-related matchers...\n`));

    const results = {
        "DIV before MUL": findDivBeforeMul(opcodes),
        "Missing DIV after MUL": findMissingDivAfterMul(opcodes),
        "Double MUL without descaling": findDoubleMulNoDescale(opcodes),
        "Rounding loss in DIV": findRoundingLossInDiv(opcodes),
        "External token no scaling": findExternalTokenNoScaling(opcodes),
    };

    let totalIssues = 0;
    for (const [label, indices] of Object.entries(results)) {
        if (indices.length > 0) {
            totalIssues += indices.length;
            console.log(chalk.red(`❌ ${label} at indices: ${indices.join(", ")}`));
        }
    }

    if (totalIssues === 0) {
        console.log(chalk.green("✅ No critical decimal-related issues found!"));
    } else {
        console.log(chalk.red(`\n⚠️  ${totalIssues} potential issues found.`));
    }

    console.log(chalk.gray("\nDone.\n"));
})();