import {CHAINID, SIGNER} from "../constants/constants";
import {Wallet} from "zksync-web3";
import {Deployer} from "@matterlabs/hardhat-zksync-deploy";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {deployments} from "hardhat";
import * as zk from "zksync-web3";

module.exports = async function (hre: HardhatRuntimeEnvironment) {
    console.log(`Deploying on ${hre.network.name}`);

    const chainId = hre.network.config.chainId
    if (chainId !== CHAINID.ZKSYNC && chainId !== CHAINID.ZKSYNC_TEST) {
        console.log(`unexpected network, ${hre.network.name} not a zk network`)
        return
    }

    const wallet = new hre.ethers.Wallet('0xd79c6854d86e44c44ae398cfe7b015e6bd4e72fccb3cf24f0d08a91e6c1dd2fc')
    // Deployer.fromEthWallet(hre)
    // const zkWallet = Wallet.fromMnemonic(process.env[`mnemonic_${hre.network.name}`]!, "m/44'/60'/0'/0/0")
    const deployer = Deployer.fromEthWallet(hre, wallet)

    let daoBaseAddress = '0x80D6555a5935086247887f5CcD87E6896eec70aD'
    let erc20Address = '0xC5ED0A90a13a9B8c701e7Bf3e8C4ffa9751B20A6'
    let daoFactoryAddress = '0xeb0C7B105998c88678f8A86Efc0bbD0Aa807A891'

    const sbtAritifact = await deployer.loadArtifact('SBTFactory')
    const sbt = await deployer.deploy(sbtAritifact,[daoFactoryAddress])
    console.log(`sbt deployed at ${sbt.address}`)

/*
    // deploy dao base imp
    if (!daoBaseAddress) {
        const daoBaseArtifact = await deployer.loadArtifact('DAOBase')
        const daoBase = await deployer.deploy(daoBaseArtifact)
        console.log(`dao base deployed at ${daoBase.address}`)
        daoBaseAddress = daoBase.address
    } else {
        console.log(`dao base resume at ${daoBaseAddress}`)
    }

    // deploy token base imp
    if (!erc20Address) {
        const erc20BaseContract = await deployer.loadArtifact('ERC20Base')
        const erc20Base = await deployer.deploy(erc20BaseContract, [])
        console.log(`erc20 deployed at ${erc20Base.address}`)
        erc20Address = erc20Base.address
    } else {
        console.log(`erc20 resume at ${erc20Address}`)
    }

    // deploy dao factory
    const daoFactoryContract = await deployer.loadArtifact('DAOFactory')
    if (!daoFactoryAddress) {
        // const daoFactory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, daoFactoryContract, [daoBaseAddress, erc20Address], {initializer: 'initialize'})
        const daoFactory = await deployer.deploy(daoFactoryContract, [])
        console.log(`dao factory deployed at ${daoFactory.address}`)
        await (await daoFactory.initialize(daoBaseAddress, erc20Address)).wait()
        await (await daoFactory.setSigner(SIGNER, true)).wait()
        daoFactoryAddress = daoFactory.address
    } else {
        console.log(`dao factory resume at ${daoFactoryAddress}`)
    }


    // const factory = new zk.ContractFactory(daoFactoryContract.abi, daoFactoryContract.bytecode, deployer.zkWallet);
    // const f = factory.attach(daoFactoryAddress)

    // deploy airdrop
    const airdropContract = await deployer.loadArtifact('DAOAirdrop')
    // const airdrop = await hre.zkUpgrades.deployProxy(
    //     deployer.zkWallet,
    //     airdropContract,
    //     [],
    //     {
    //         constructorArgs: [daoFactoryAddress],
    //         unsafeAllow: ["constructor", "state-variable-immutable"],
    //         kind: "transparent",
    //         initializer: false,
    //     }
    // )
    const airdrop = await deployer.deploy(airdropContract, [daoFactoryAddress])
    console.log(`dao airdrop deployed at ${airdrop.address}`)*/
}
