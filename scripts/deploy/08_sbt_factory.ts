import { Interface } from "ethers/lib/utils";
import { run } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async ({
        network,
        deployments,
        getNamedAccounts,
    }: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer, admin } = await getNamedAccounts();
    console.log(`08 - Deploying SBTFactory on ${network.name}`);

    const daoFactory = await deployments.get('DAOFactory');
    console.log(`resume dao fatcory at: ${daoFactory.address}`)
    
    const sbtFactoryLogic = await deploy('SBTFactoryLogic', {
        contract: 'SBTFactory',
        from: deployer,
        log: true,
        args: [daoFactory.address]
    });
    console.log(`SBTFactoryLogic Logic @ ${sbtFactoryLogic.address}`)
    try {
        await run("verify:verify", {
            address: '0x507e6585455e4C68748D8c623Ad45dA4Ee2a6272',
            constructorArguments: [daoFactory.address],
        });
    } catch (error) {
        console.log(error);
    }

    const proxy = await deploy('SBTFactory', {
        contract: 'TransparentUpgradeableProxy',
        from: deployer,
        log: true,
        args: [
            sbtFactoryLogic.address,
            admin,
            new Interface(sbtFactoryLogic.abi).encodeFunctionData('initialize', [])
        ]
    });
    console.log(`SBTFactory Proxy @ ${proxy.address}`)

    try {
        await run("verify:verify", {
            address: proxy.address,
            constructorArguments: [sbtFactoryLogic.address, admin, new Interface(sbtFactoryLogic.abi).encodeFunctionData('initialize', [])],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["SBTFactory"];

export default main;
