//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.9;

import './interfaces/IDAOFactory.sol';
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract PublicSale is Ownable2StepUpgradeable, ReentrancyGuardUpgradeable {

    address public immutable factoryAddress;
    mapping(uint256 => Sale) public sales;

    constructor(address factoryAddress_) {
        factoryAddress = factoryAddress_;
    }

    struct Sale {
        address creator;
        address saleToken;
        uint256 saleAmount;
        address receiveToken;
        uint256 pricePer;
        uint256 limitMin;
        uint256 limitMax;
        uint256 startTime;
        uint256 endTime;

        uint256 soldAmount;
        bool isCancel;

        mapping(address => uint256) boughtAmounts;
    }

    event CreatedSale(uint256 indexed saleId, address indexed saleToken, address indexed receiveToken, uint256 saleAmount, uint256 pricePer, uint256 limitMin, uint256 limitMax, uint256 startTime, uint256 endTime);
    event Purchased(uint256 indexed saleId, uint256 indexed buyAmount, uint256 indexed payAmount);
    event CancelSale(uint256 indexed saleId);

    function CreateSale(
        uint256 _saleId,
        address _saleToken,
        uint256 _saleAmount,
        address _receiveToken,
        uint256 _pricePer,
        uint256 _limitMin,
        uint256 _limitMax,
        uint256 _startTime,
        uint256 _endTime,
        bytes calldata _signature
    ) external {
        Sale storage sale = sales[_saleId];
        require(sale.creator == address(0), "PublicSale: invalid saleId.");
        require(_startTime < _endTime && _endTime > block.timestamp, "PublicSale: invalid duration.");
        require(_saleAmount > 0, "PublicSale: invalid sale amount.");
        require(_pricePer > 0, "PublicSale: invalid price.");
        require(_limitMin >= 0 && _limitMax > 0 && _limitMax >= _limitMin, "PublicSale: invalid purchase.");
        require(_saleToken != address(0), "PublicSale: invalid token.");

        bytes32 _hash = ECDSAUpgradeable.toEthSignedMessageHash(
            keccak256(
                abi.encodePacked(
                    _msgSender(),
                    _saleId,
                    _saleToken,
                    _saleAmount,
                    _receiveToken,
                    _pricePer,
                    _limitMin,
                    _limitMax,
                    _startTime,
                    _endTime
                )
            )
        );
        require(IDAOFactory(factoryAddress).isSigner(ECDSAUpgradeable.recover(_hash, _signature)), 'PublicSale: invalid signer.');

        sale.creator = _msgSender();
        sale.saleToken = _saleToken;
        sale.saleAmount = _saleAmount;
        sale.receiveToken = _receiveToken;
        sale.pricePer = _pricePer;
        sale.limitMin = _limitMin;
        sale.limitMax = _limitMax;
        sale.startTime = _startTime;
        sale.endTime = _endTime;

        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(_saleToken), _msgSender(), address(this), _saleAmount);

        emit CreatedSale(_saleId, _saleToken, _receiveToken, _saleAmount, _pricePer, _limitMin, _limitMax, _startTime, _endTime);
    }

    function Purchase(
        uint256 _saleId,
        uint256 _buyAmount,
        bytes calldata _signature
    ) external nonReentrant payable {
        Sale storage sale = sales[_saleId];
        require(sale.creator != address(0) && !sale.isCancel, "PublicSale: invalid sale.");
        require(sale.startTime <= block.timestamp && sale.endTime > block.timestamp, "PublicSale: invalid sale.");
        require(_buyAmount > 0 && _buyAmount >= sale.limitMin, "PublicSale: invalid amount.");

        uint256 soldAmount = sale.soldAmount + _buyAmount;
        uint256 boughtAmount = sale.boughtAmounts[_msgSender()] + _buyAmount;
        require(soldAmount <= sale.saleAmount, "PublicSale: invalid amount.");
        require(boughtAmount <= sale.limitMax, "PublicSale: invalid amount.");

        bytes32 _hash = ECDSAUpgradeable.toEthSignedMessageHash(
            keccak256(
                abi.encodePacked(
                    _msgSender(),
                    _saleId,
                    _buyAmount
                )
            )
        );
        require(IDAOFactory(factoryAddress).isSigner(ECDSAUpgradeable.recover(_hash, _signature)), 'PublicSale: invalid signer.');

        sale.soldAmount = soldAmount;
        sale.boughtAmounts[_msgSender()] = boughtAmount;

        uint256 receiveAmount;
        address receiveToken = sale.receiveToken;
        if (receiveToken == address(0)) {
            receiveAmount = sale.pricePer * _buyAmount / 1 ether;
            require(receiveAmount == msg.value, "PublicSale: insufficient value.");
            AddressUpgradeable.sendValue(payable(sale.creator), receiveAmount);
        } else {
            receiveAmount = sale.pricePer * _buyAmount / (10 ** IERC20MetadataUpgradeable(receiveToken).decimals());
            SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(receiveToken), _msgSender(), sale.creator, receiveAmount);
        }
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(sale.saleToken), _msgSender(), _buyAmount);

        emit Purchased(_saleId, _buyAmount, receiveAmount);
    }

    function Cancel(uint256 _saleId) external {
        Sale storage sale = sales[_saleId];
        uint256 amount = sale.saleAmount - sale.soldAmount;
        require(sale.creator == _msgSender(), "PublicSale: invalid account.");
        require(amount > 0, "PublicSale: invalid balance.");
        require(!sale.isCancel, "PublicSale: cancelled.");

        sale.isCancel = true;

        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(sale.saleToken), _msgSender(), amount);

        emit CancelSale(_saleId);
    }
}
