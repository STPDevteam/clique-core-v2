import { ethers } from "hardhat";

async function main() {
    const signers = await ethers.getSigners();

    const DAOBase = await ethers.getContractFactory("DAOBase");
    const daoBase = await DAOBase.deploy();
    await daoBase.deployed();

    const ERC20Base = await ethers.getContractFactory('ERC20Base');
    const erc20Base = await ERC20Base.deploy();
    await erc20Base.deployed();

    const DAOFactory = await ethers.getContractFactory('DAOFactory');
    const daoFactory = await DAOFactory.deploy();
    await daoFactory.deployed();

    const STPProxy = await ethers.getContractFactory('STPProxy');
    const stpProxy = await STPProxy.deploy(daoFactory.address, signers[0].address);
    await stpProxy.deployed();

    // init
    const proxyDaoFactory = DAOFactory.attach(stpProxy.address);
    const txInit = await proxyDaoFactory.connect(signers[1]).initialize(daoBase.address, erc20Base.address);
    await txInit.wait();

    console.log("DAOBase deployed to:", daoBase.address);
    console.log("DAOFactory deployed to:", daoFactory.address);
    console.log("ProxyDAOFactory deployed to:", stpProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
