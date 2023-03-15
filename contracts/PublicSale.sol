//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.9;

import './interfaces/IDAOFactory.sol';
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract PublicSale is Ownable2StepUpgradeable {

    address public immutable factoryAddress;
    mapping(uint256 => sale) public sales;

    constructor(address factoryAddress_) {
        factoryAddress = factoryAddress_;
    }

    struct sale {
        address creator;
        address saleToken;
        uint256 saleAmount;
        address receiveToken;
        uint256 pricePer;
        uint256 limitMin;
        uint256 limitMax;
        uint256 startTime;
        uint256 endTime;

        uint256 soldedAmount;
        bool isCancel;
    }

    event CreatedSale(uint256 indexed saleId, address indexed saleToken, address indexed receiveToken, uint256 saleAmount, uint256 pricePer, uint256 limitMin, uint256 limitMax, uint256 startTime, uint256 endTime);
    event Purchased(uint256 indexed saleId, uint256 indexed buyAmount);
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
        require(_startTime < _endTime && _endTime > block.timestamp, "PublicSale: invalid duration.");
        require(_saleAmount > 0, "PublicSale: invalid sale amount.");
        require(_pricePer > 0, "PublicSale: invalid price.");
        require(_limitMin > 0 && _limitMax > 0 && _limitMax >= _limitMin, "PublicSale: invalid purchase.");
        require(_saleToken != address(0) && _receiveToken != address(0), "PublicSale: invalid token.");

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

        sales[_saleId].creator = _msgSender();
        sales[_saleId].saleToken = _saleToken;
        sales[_saleId].saleAmount = _saleAmount;
        sales[_saleId].receiveToken = _receiveToken;
        sales[_saleId].pricePer = _pricePer;
        sales[_saleId].limitMin = _limitMin;
        sales[_saleId].limitMax = _limitMax;
        sales[_saleId].startTime = _startTime;
        sales[_saleId].endTime = _endTime;

        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(_saleToken), _msgSender(), address(this), _saleAmount);

        emit CreatedSale(_saleId, _saleToken, _receiveToken, _saleAmount, _pricePer, _limitMin, _limitMax, _startTime, _endTime);
    }

    function Purchase(
        uint256 _saleId,
        uint256 _buyAmount,
        bytes calldata _signature
    ) external {
        require(!sales[_saleId].isCancel, "PublicSale: invalid sale.");
        require(sales[_saleId].startTime < block.timestamp && sales[_saleId].endTime > block.timestamp, "PublicSale: invalid sale.");
        require(_buyAmount > 0 && _buyAmount >= sales[_saleId].limitMin && _buyAmount <= sales[_saleId].limitMax, "PublicSale: invalid amount.");
        require(sales[_saleId].soldedAmount + _buyAmount <= sales[_saleId].saleAmount, "PublicSale: invalid amount.");

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

        sales[_saleId].soldedAmount += _buyAmount;

        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(sales[_saleId].receiveToken), _msgSender(), sales[_saleId].creator, sales[_saleId].pricePer * _buyAmount);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(sales[_saleId].saleToken), _msgSender(), _buyAmount);

        emit Purchased(_saleId, _buyAmount);
    }

    function Cancel(uint256 _saleId) external {
        uint256 amount = sales[_saleId].saleAmount - sales[_saleId].soldedAmount;
        require(sales[_saleId].creator == _msgSender(), "PublicSale: invalid account.");
        require(amount > 0, "PublicSale: invalid balance.");

        sales[_saleId].isCancel = true;

        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(sales[_saleId].saleToken), _msgSender(), amount);

        emit CancelSale(_saleId);
    }
}
