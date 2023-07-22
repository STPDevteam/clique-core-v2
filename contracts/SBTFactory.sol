//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.9;

import './interfaces/IDAOFactory.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract SBT is ERC721Enumerable {

    string public baseTokenURI;
    uint256 public immutable cap;
    address public immutable sbtFactory;

    uint256 public currentTokenId;

    constructor(
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI,
        address _sbtFactory
    ) ERC721(_name, _symbol) {
        cap = _totalSupply;
        baseTokenURI = _baseTokenURI;
        sbtFactory = _sbtFactory;
    }

    /// @dev Returns an URI for a given token ID
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function mint(address _account) external returns (uint256) {
        require(msg.sender == sbtFactory);
        
        uint256 tokenId = currentTokenId++;
        ERC721._safeMint(_account, tokenId);

        require(totalSupply() <= cap);

        return tokenId;
    }
}

contract SBTFactory is OwnableUpgradeable {

    address public immutable daoFactory;

    mapping (address => mapping (uint256 => bool)) public minted;
    mapping (uint256 => address) public deployedAddress;

    event Deployed(uint256 indexed id, address sbtAddress);
    event Minted(uint256 indexed id, address indexed account, uint256 tokenId);

    constructor(address _daoFactory) {
        daoFactory = _daoFactory;
    }
    
    function initialize() external initializer {
        OwnableUpgradeable.__Ownable_init();
    }

    function createSBT(
        uint256 _id,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI,
        bytes calldata _signature
    ) external {
        // check if deployed
        require(deployedAddress[_id] == address(0), 'alreday deployed.');
        
        // check signature
        bytes32 h = ECDSAUpgradeable.toEthSignedMessageHash(
            keccak256(
                abi.encodePacked(
                    msg.sender,
                    block.chainid,
                    address(this),
                    _id,
                    _totalSupply,
                    _name,
                    _symbol,
                    _baseTokenURI
                )
            )
        );
        address signer = ECDSAUpgradeable.recover(h, _signature);
        require(IDAOFactory(daoFactory).isSigner(signer), 'invalid signer.');

        // deploy
        address sbtAddress = address(new SBT(_totalSupply, _name, _symbol, _baseTokenURI, address(this)));
        deployedAddress[_id] = sbtAddress;

        emit Deployed(_id, sbtAddress);
    }

    function mintSBT(uint256 _id, bytes calldata _signature) external {
        // check if deployed
        require(deployedAddress[_id] != address(0), 'invalid id.');
        // check if minted
        require(!minted[msg.sender][_id], 'already minted.');

        // check signature
        bytes32 h = ECDSAUpgradeable.toEthSignedMessageHash(
            keccak256(
                abi.encodePacked(
                    _id,
                    block.chainid,
                    address(this),
                    msg.sender
                )
            )
        );
        address signer = ECDSAUpgradeable.recover(h, _signature);
        require(IDAOFactory(daoFactory).isSigner(signer), 'invalid signer.');

        // mint
        uint256 tokenId = SBT(deployedAddress[_id]).mint(msg.sender);
        minted[msg.sender][_id] = true;

        emit Minted(_id, msg.sender, tokenId);
    }
}
