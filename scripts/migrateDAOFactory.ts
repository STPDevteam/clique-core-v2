import { ethers } from "hardhat";

async function main() {
    const DAO_FACTORY_ADDRESS = '0xfeC03ba54EC9d15ec6A8Cb2138b9FD4Ee711ebD0';

    const DAOFactory = await ethers.getContractFactory('DAOFactory');
    const daoFactory = await DAOFactory.deploy();
    await daoFactory.deployed();

    const STPProxy = await ethers.getContractFactory('TransparentUpgradeableProxy');
    const stpProxy = STPProxy.attach(DAO_FACTORY_ADDRESS);
    const txUpgrade = await stpProxy.upgradeTo(daoFactory.address);
    await txUpgrade.wait();

    console.log("DAOFactory deployed to:", daoFactory.address);
    console.log("ProxyDAOFactory deployed to:", stpProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
