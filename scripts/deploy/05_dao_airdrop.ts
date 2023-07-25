import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
        network,
        deployments,
        ethers,
        getNamedAccounts,
    }: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer, admin } = await getNamedAccounts();
    console.log(`05 - Deploying DAOAirdrop on ${network.name}`);

    const logicDAOAirdrop = await deployments.get('DAOAirdropLogic');

    const proxy = await deploy('DAOAirdrop', {
        contract: 'TransparentUpgradeableProxy',
        from: deployer,
        args: [logicDAOAirdrop.address, admin, '0x'],
        log: true,
    });
    console.log(`Dao Factory Proxy @ ${proxy.address}`)

    try {
        await run("verify:verify", {
            address: proxy.address,
            constructorArguments: [logicDAOAirdrop.address, admin, '0x'],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["DAOAirdrop"];

export default main;
