import { ethers } from "hardhat";

async function main() {
    const DAOBase = await ethers.getContractFactory("DAOBase");
    const daoBase = await DAOBase.deploy();
    await daoBase.deployed();

    console.log("DAOBase deployed to:", daoBase.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
