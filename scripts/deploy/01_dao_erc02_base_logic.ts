import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
    network,
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(`01 - Deploying ERC20Base Logic on ${network.name}`);

    const erc20Base = await deploy("ERC20BaseLogic", {
        contract: "ERC20Base",
        from: deployer,
    });
    console.log(`ERC20Base @ ${erc20Base.address}`);

    try {
        await run("verify:verify", {
            address: erc20Base.address,
            constructorArguments: [],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["ERC20BaseLogic"];

export default main;
