
import { EVM } from "evm";
import { provider } from "../helpers/constants";

// ts-node disassemble.ts > out.log 2>&1

export async function disassembleContract(address: string) {
    const bytecode = await provider.getCode(address);
    if (!bytecode || bytecode === "0x") {
        console.error("No bytecode found at that address.");
        return;
    }

    const evm = new EVM(bytecode);

    // Fetch all available insights
    const opcodes = evm.getOpcodes();
    const functions = evm.getFunctions();
    const events = evm.getEvents();
    const jumpDests = evm.getJumpDestinations();

    // console.log("\n== FUNCTIONS ==");
    // console.log(functions);

    // console.log("\n== EVENTS ==");
    // console.log(events);

    // console.log(opcodes);
    return opcodes;
}

// disassembleContract("0x727ccbF8c2C57e577A85Bf682E3EE700970a56ed"); // CryptoKitties
