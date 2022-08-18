import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { DAOFactory, ERC20Base, ERC20Base__factory } from '../typechain-types';
import { Signer } from 'ethers';


describe('DAOFactory', function () {
    let tx;
    let deployer: Signer;
    let proxyOwner: Signer;
    let logicOwner: Signer;
    let user1: Signer;
    let user2: Signer;
    let user3: Signer;
    let daoFactoryProxy: DAOFactory;

    let ERC20Base: ERC20Base__factory;
    let DAOBase;
    let DAOFactory;

    beforeEach(async () => {
        [deployer, proxyOwner, logicOwner, user1, user2, user3] = await ethers.getSigners();

        ERC20Base = await ethers.getContractFactory('ERC20Base');
        const erc20Base = await ERC20Base.deploy();
        await erc20Base.deployed();

        DAOBase = await ethers.getContractFactory('DAOBase');
        const daoBase = await DAOBase.deploy();
        await daoBase.deployed();

        DAOFactory = await ethers.getContractFactory('DAOFactory');
        const daoFactory = await DAOFactory.deploy();
        await daoFactory.deployed();

        const STPProxy = await ethers.getContractFactory('TransparentUpgradeableProxy');
        const stpProxy = await STPProxy.deploy(daoFactory.address, await proxyOwner.getAddress(), '0x');
        await stpProxy.deployed();

        daoFactoryProxy = DAOFactory.attach(stpProxy.address);
        tx = await daoFactoryProxy.connect(logicOwner).initialize(daoBase.address, erc20Base.address);
        await tx.wait();
    });

    describe('claimReserve', function () {
        let deployedToken: ERC20Base;

        beforeEach(async () => {
            tx = await daoFactoryProxy.connect(logicOwner).createERC20(
                'Test token',
                'TTOKEN',
                '',
                18,
                ethers.utils.parseEther('1000'),
                [
                    [await user1.getAddress(), ethers.utils.parseEther('1000'), parseInt(String(new Date().getTime() / 1000 + 600))]
                ]
            );
            await tx.wait();

            const deployedTokenAddress = await daoFactoryProxy.tokensByAccount(await logicOwner.getAddress(), 0);
            deployedToken = ERC20Base.attach(deployedTokenAddress);
        });

        it('Should revert with the right error if called too soon or too much', async function () {
            await expect(daoFactoryProxy.connect(user1).claimReserve(0)).to.be.revertedWith(
                "DAOFactory: locked."
            );
            await expect(daoFactoryProxy.connect(user1).claimReserve(1)).to.be.revertedWith(
                "DAOFactory: invalid index."
            );
        });

        it('Should claim if the unlockTime has arrived', async function () {
            await time.increase(600);

            await expect(daoFactoryProxy.connect(user1).claimReserve(0))
                .to.emit(daoFactoryProxy, 'ClaimReserve')
                .withArgs(await user1.getAddress(), deployedToken.address, ethers.utils.parseEther('1000'));
            expect(await deployedToken.balanceOf(await user1.getAddress())).to.be.equal(ethers.utils.parseEther('1000'));
        });
    });
});
