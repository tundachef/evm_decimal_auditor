
export const retrieveEnvVariable = (variableName: string) => {
    const variable = process.env[variableName] || "";
    if (variableName === "GRPC_XTOKEN") return variable;
    if (!variable) {
        console.error(`${variableName} is not set`);
        process.exit(1);
    }
    return variable;
};