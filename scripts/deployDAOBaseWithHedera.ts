import { FileCreateTransaction, Client, ContractCreateFlow, ContractExecuteTransaction, ContractFunctionParameters, ContractId, ContractCallQuery, Hbar, AccountId } from "@hashgraph/sdk";
import { deployments, ethers } from "hardhat";
import { SIGNER } from "../constants/constants";

async function main() {
    const client = Client.forTestnet();
    // Account and Private Key      (ED25519)
    client.setOperator('', '')

    //  1.   deploy DAOBase Logic contract
    const contractBytecodeDAOBase = (await deployments.getArtifact('DAOBase')).bytecode

    const contractCreateTxDaoBase = new ContractCreateFlow().setBytecode(contractBytecodeDAOBase).setGas(1200000);
    const contractCreateSubmitDaoBase = await contractCreateTxDaoBase.execute(client);
    const contractCreateRxDaoBase = await contractCreateSubmitDaoBase.getReceipt(client);
    const contractIdDaoBase = contractCreateRxDaoBase.contractId;
    if (!contractIdDaoBase) {
        throw new Error('panic...');
    }
    const contractAddressDaoBase = contractIdDaoBase.toSolidityAddress();
    console.log("The DAOBase Logic contract byte code file ID is " + contractAddressDaoBase)

    //  2.  deploy ERC20Base Logic contract
    const contractBytecodeERC20Base = (await deployments.getArtifact('ERC20Base')).bytecode
    const contractCreateTxERC20Base = new ContractCreateFlow().setBytecode(contractBytecodeERC20Base).setGas(1200000);
    const contractCreateSubmitERC20Base = await contractCreateTxERC20Base.execute(client);
    const contractCreateRxERC20Base = await contractCreateSubmitERC20Base.getReceipt(client);
    const contractIdERC20Base = contractCreateRxERC20Base.contractId;
    if (!contractIdERC20Base) {
        throw new Error('panic...');
    }
    const contractAddressERC20Base = contractIdERC20Base.toSolidityAddress();
    console.log("The ERC20Base Logic contract byte code file ID is " + contractAddressERC20Base)

    //  3.  deploy DAOFactory Logic Contract
    const contractBytecodeFactory = (await deployments.getArtifact('DAOFactory')).bytecode
    const contractCreateTxFactory = new ContractCreateFlow().setBytecode(contractBytecodeFactory).setGas(1200000);
    const contractCreateSubmitFactory = await contractCreateTxFactory.execute(client);
    const contractCreateRxFactory = await contractCreateSubmitFactory.getReceipt(client);
    const contractIdFactory = contractCreateRxFactory.contractId;
    if (!contractIdFactory) {
        throw new Error('panic...');
    }

    const contractAddressFactory = contractIdFactory.toSolidityAddress();

    console.log("The DAOFactory Logic contract byte code file ID is " + contractAddressFactory)


    //  4.  deploy DaoFaucet Proxy contract
    const contractBytecodeTransparentUpgradeableProxy = (await deployments.getArtifact('TransparentUpgradeableProxy')).bytecode
    const contractCreateTxTransparentUpgradeableProxy = new ContractCreateFlow()
        .setBytecode(contractBytecodeTransparentUpgradeableProxy)
        .setConstructorParameters(
            new ContractFunctionParameters()
                .addAddress(contractAddressFactory)
                .addAddress(AccountId.fromString('0.0.48942409').toSolidityAddress())
                .addBytes(new Uint8Array())
                // .addBytes(Array(initData.utf8))

        )
        .setGas(1200000);

    const contractCreateSubmitTransparentUpgradeableProxy = await contractCreateTxTransparentUpgradeableProxy.execute(client);
    const contractCreateRxTransparentUpgradeableProxy = await contractCreateSubmitTransparentUpgradeableProxy.getReceipt(client);
    const contractIdTransparentUpgradeableProxy = contractCreateRxTransparentUpgradeableProxy.contractId;
    if (!contractIdTransparentUpgradeableProxy) {
        throw new Error('panic...');
    }
    const contractAddressTransparentUpgradeableProxy = contractIdTransparentUpgradeableProxy.toSolidityAddress();
    console.log("The TransparentUpgradeableProxy smart contract byte code file ID is " + contractAddressTransparentUpgradeableProxy)

    const contractExecTx = await new ContractExecuteTransaction()
        //Set the ID of the contract
        .setContractId(contractIdTransparentUpgradeableProxy)
        //Set the gas for the contract call
        .setGas(1200000)
        //Set the contract function to call
        .setFunction(
            "initialize",
            new ContractFunctionParameters()
                .addAddress(contractAddressDaoBase)
                .addAddress(contractAddressERC20Base)
        );

    //Submit the transaction to a Hedera network and store the response
    const submitExecTx0 = await contractExecTx.execute(client);

    //Get the receipt of the transaction
    const receipt0 = await submitExecTx0.getReceipt(client);
    console.log("The transaction status is " + receipt0.status.toString());


    const contractExecTx1 = await new ContractExecuteTransaction()
        //Set the ID of the contract
        .setContractId(contractIdTransparentUpgradeableProxy)
        //Set the gas for the contract call
        .setGas(1200000)
        //Set the contract function to call
        .setFunction(
            "setSigner",
            new ContractFunctionParameters()
                .addAddress(SIGNER)
                .addBool(true)
        );

    //Submit the transaction to a Hedera network and store the response
    const submitExecTx1 = await contractExecTx1.execute(client);

    //Get the receipt of the transaction
    const receipt1 = await submitExecTx1.getReceipt(client);
    console.log("The SIGN status is " + receipt1.status.toString());



    //  5.  deploy Airdrop Logic contract
    const contractBytecodeAirdrop = (await deployments.getArtifact('DAOAirdrop')).bytecode
    const contractCreateTxAirdrop = new ContractCreateFlow().setBytecode(contractBytecodeAirdrop)
        .setConstructorParameters(
            new ContractFunctionParameters()
                .addAddress(contractAddressTransparentUpgradeableProxy)
        )
        .setGas(1200000);

    const contractCreateSubmitAirdrop = await contractCreateTxAirdrop.execute(client);
    const contractCreateRxAirdrop = await contractCreateSubmitAirdrop.getReceipt(client);
    const contractIdAirdrop = contractCreateRxAirdrop.contractId;
    if (!contractIdAirdrop) {
        throw new Error('panic...');
    }

    const contractAddressAirdrop = contractIdAirdrop.toSolidityAddress();

    console.log("The Airdrop smart contract byte code file ID is " + contractAddressAirdrop)


    //  6.  deploy Airdrop Proxy Contract
    // const contractBytecodeTransparentUpgradeableProxy = (await deployments.getArtifact('TransparentUpgradeableProxy')).bytecode
    const contractCreateTxTransparentUpgradeableProxy1 = new ContractCreateFlow()
        .setBytecode(contractBytecodeTransparentUpgradeableProxy)
        .setConstructorParameters(
            new ContractFunctionParameters()
                .addAddress(contractAddressAirdrop)
                .addAddress(AccountId.fromString('0.0.48942409').toSolidityAddress())
                .addBytes(new Uint8Array())
        )
        .setGas(1200000);

    const contractCreateSubmitTransparentUpgradeableProxy1 = await contractCreateTxTransparentUpgradeableProxy1.execute(client);
    const contractCreateRxTransparentUpgradeableProxy1 = await contractCreateSubmitTransparentUpgradeableProxy1.getReceipt(client);
    const contractIdTransparentUpgradeableProxy1 = contractCreateRxTransparentUpgradeableProxy1.contractId;
    if (!contractIdTransparentUpgradeableProxy1) {
        throw new Error('panic...');
    }
    const contractAddressTransparentUpgradeableProxy1 = contractIdTransparentUpgradeableProxy1.toSolidityAddress();
    console.log("The TransparentUpgradeableProxy1 smart contract byte code file ID is " + contractAddressTransparentUpgradeableProxy1)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
function deploy(arg0: string, arg1: { contract: string; from: any; args: any[]; }) {
    throw new Error("Function not implemented.");
}

