import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
    solidity: "0.8.19",
    networks: {
        hardhat: {
            forking: {
                url: "https://mainnet.infura.io/v3/5aba9a86b6994516850405fd8f18c075",
                blockNumber: 22494600, // Replace with the desired block number
            }
        }
    }
};

export default config;
