import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
        network,
        deployments,
        getNamedAccounts,
    }: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(`09 - Deploying Voting on ${network.name}`);

    const voting = await deploy('voting', {
        contract: 'Voting',
        from: deployer,
        log: true,
    });
    console.log(`Voting @ ${voting.address}`)

    try {
        await run("verify:verify", {
            address: voting.address,
            constructorArguments: [],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["Voting"];

export default main;
