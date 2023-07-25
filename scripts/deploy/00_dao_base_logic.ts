import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
    network,
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(`00 - Deploying DAOBase Logic on ${network.name}`);

    const daoBase = await deploy("DAOBaseLogic", {
        contract: "DAOBase",
        from: deployer,
        log: true,
    });
    console.log(`DAOBase @ ${daoBase.address}`);

    try {
        await run("verify:verify", {
            address: daoBase.address,
            constructorArguments: [],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["DAOBaseLogic"];

export default main;
