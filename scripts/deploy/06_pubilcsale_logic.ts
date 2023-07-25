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
    console.log(`06 - Deploying PublicSale Logic on ${network.name}`);

    const daoFactory = await deployments.get('DAOFactory');
    
    const publicSale = await deploy('PublicSaleLogic', {
        contract: 'PublicSale',
        from: deployer,
        args: [daoFactory.address],
        log: true,
    });
    console.log(`PublicSale Logic Logic @ ${publicSale.address}`)

    try {
        await run("verify:verify", {
            address: publicSale.address,
            constructorArguments: [daoFactory.address],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["PublicSaleLogic"];

export default main;
