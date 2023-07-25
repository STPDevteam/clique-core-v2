import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
        network,
        deployments,
        getNamedAccounts,
    }: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(`08 - Deploying SBTFactory on ${network.name}`);

    const daoFactory = await deployments.get('DAOFactory');
    console.log(`resume dao fatcory at: ${daoFactory.address}`)
    
    const sbtFactoryLogic = await deploy('SBTFactory', {
        contract: 'SBTFactory',
        from: deployer,
        log: true,
        args: [daoFactory.address],
        proxy: {
            owner: deployer,
            proxyContract: 'OpenZeppelinTransparentProxy',
        }
    });
    console.log(`SBTFactory @ ${sbtFactoryLogic.address}`)
    // try {
    //     await run("verify:verify", {
    //         address: sbtFactoryLogic.address,
    //         constructorArguments: [daoFactory.address],
    //     });
    // } catch (error) {
    //     console.log(error);
    // }
};
main.tags = ["SBTFactory"];

export default main;