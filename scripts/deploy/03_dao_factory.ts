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
    console.log(`02 - Deploying DAOFactory on ${network.name}`);

    const logicDAOBase = await deployments.get('DAOBaseLogic');
    const logicERC20Base = await deployments.get('ERC20BaseLogic');
    const logicDaoFactory = await deployments.get('DAOFactoryLogic');

    const DAOFactory = await ethers.getContractFactory('DAOFactory', {});
    const initArgs = [
        logicDAOBase.address,
        logicERC20Base.address
    ];

    const initData = DAOFactory.interface.encodeFunctionData(
        'initialize',
        initArgs
    );

    const proxy = await deploy('DAOFactory', {
       contract: 'TransparentUpgradeableProxy',
       from: deployer,
       args: [logicDaoFactory.address, admin, initData]
    });
    console.log(`Dao Factory Proxy @ ${proxy.address}`)

    try {
        await run("verify:verify", {
            address: proxy.address,
            constructorArguments: [logicDaoFactory.address, admin, initData],
        });
    } catch (error) {
        console.log(error);
    }
};
main.tags = ["DAOFactory"];

export default main;
