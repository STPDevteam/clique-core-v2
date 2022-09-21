import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
    network,
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(`02 - Deploying DAOFactory Logic on ${network.name}`);

    const daoFactory = await deploy("DAOFactoryLogic", {
        contract: "DAOFactory",
        from: deployer,
    });
    console.log(`DAOFactory @ ${daoFactory.address}`);

    try {
        await run("verify:verify", {
            address: daoFactory.address,
            constructorArguments: [],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["FactoryLogic"];

export default main;
