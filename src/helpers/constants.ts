import { ethers } from "ethers";
import { retrieveEnvVariable } from "./util";

export const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/5aba9a86b6994516850405fd8f18c075");


export const EMAIL_HOST = "smtp.hostinger.com";
export const EMAIL_ADDRESS = "trader@phdforex.com"
export const EMAIL_PASSWORD = "e6l9#B@1@3wb"
export const EMAIL_PORT = "465"
export const RECEIVER_EMAIL_ADDRESS = "rwsenfuka@gmail.com"