import { ethers } from "hardhat";

async function main() {
    const ERC20Base = await ethers.getContractFactory("ERC20Base");
    const erc20Base = await ERC20Base.deploy();
    await erc20Base.deployed();

    console.log("ERC20Base deployed to:", erc20Base.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
