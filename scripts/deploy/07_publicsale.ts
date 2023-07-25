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
    console.log(`07 - Deploying PublicSale on ${network.name}`);

    const logicPublicSale = await deployments.get('PublicSaleLogic');

    const proxy = await deploy('PublicSale', {
        contract: 'TransparentUpgradeableProxy',
        from: deployer,
        args: [logicPublicSale.address, admin, '0x'],
        log: true,
    });
    console.log(`Dao Factory Proxy @ ${proxy.address}`)

    try {
        await run("verify:verify", {
            address: proxy.address,
            constructorArguments: [logicPublicSale.address, admin, '0x'],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["PublicSale"];

export default main;
