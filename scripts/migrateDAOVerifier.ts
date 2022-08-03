import { ethers } from "hardhat";

async function main() {
    const DAO_VERIFIER = '0x03919E8A7db18B89aC287ddb8ad5DE34F44E1E11';
    const MOCK_STPT = "0x555235a4cad466e480819d593b1d37cc1f8dd5bf";

    const DAOVerifier = await ethers.getContractFactory("DAOVerifier");
    const daoVerifier = await DAOVerifier.deploy(MOCK_STPT);
    await daoVerifier.deployed();

    const STPProxy = await ethers.getContractFactory('TransparentUpgradeableProxy');
    const stpProxy = STPProxy.attach(DAO_VERIFIER);
    const txUpgrade = await stpProxy.upgradeTo(daoVerifier.address);
    await txUpgrade.wait();

    console.log("DAOVerifier deployed to:", daoVerifier.address);
    console.log("ProxyDAOVerifier deployed to:", stpProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
