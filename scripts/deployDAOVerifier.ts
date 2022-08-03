import { ethers } from "hardhat";

async function main() {
    const signers = await ethers.getSigners();

    // const MockSTPT = await ethers.getContractFactory('MockSTPT');
    // const mockSTPT = await MockSTPT.deploy();
    // await mockSTPT.deployed();
    const STPTAddress = '0xDe7D85157d9714EADf595045CC12Ca4A5f3E2aDb';

    const DAOVerifier = await ethers.getContractFactory("DAOVerifier");
    const daoVerifier = await DAOVerifier.deploy(STPTAddress);
    await daoVerifier.deployed();

    const STPProxy = await ethers.getContractFactory('TransparentUpgradeableProxy');
    const stpProxy = await STPProxy.deploy(daoVerifier.address, signers[0].address, '0x');
    await stpProxy.deployed();

    // init
    const proxyDAOVerifier = DAOVerifier.attach(stpProxy.address);
    const txInit = await proxyDAOVerifier.connect(signers[1]).initialize("100000000000000000000000");
    await txInit.wait();

    console.log("DAOVerifier deployed to:", daoVerifier.address);
    console.log("STPProxy deployed to:", stpProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
