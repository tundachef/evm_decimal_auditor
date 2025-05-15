
import { EVM } from "evm";
import { provider } from "../helpers/constants";

// ts-node test.ts > out.log 2>&1

export async function disassembleContract(address: string) {
    const bytecode = await provider.getCode(address);
    if (!bytecode || bytecode === "0x") {
        console.error("No bytecode found at that address.");
        return;
    }

    const evm = new EVM(bytecode);
    const opcodes = evm.getOpcodes();

    console.log("== OPCODES ==");
    // console.log(opcodes);
    return opcodes;
}

// disassembleContract("0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"); // CryptoKitties
