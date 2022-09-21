import { ethers } from "hardhat";

async function main() {
    const SimpleERC721 = await ethers.getContractFactory('SimpleERC721');
    const simpleERC721_1 = await SimpleERC721.deploy('Simple ERC721 1', 'SE1');
    await simpleERC721_1.deployed();

    const simpleERC721_2 = await SimpleERC721.deploy('Simple ERC721 2', 'SE2');
    await simpleERC721_2.deployed();

    const simpleERC721_3 = await SimpleERC721.deploy('Simple ERC721 3', 'SE3');
    await simpleERC721_3.deployed();

    console.log("SimpleERC721_1 deployed to:", simpleERC721_1.address);
    console.log("SimpleERC721_2 deployed to:", simpleERC721_2.address);
    console.log("SimpleERC721_3 deployed to:", simpleERC721_3.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
