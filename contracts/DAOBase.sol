//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.9;

import './interfaces/IDAOBase.sol';
import './interfaces/IDAOFactory.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

contract DAOBase is OwnableUpgradeable, IDAOBase {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // @dev constant
    uint256 public constant SETTING_TYPE_GENERAL = 0;
    uint256 public constant SETTING_TYPE_TOKEN = 1;
    uint256 public constant SETTING_TYPE_GOVERNANCE = 2;

    // @dev dao factory address
    address public factoryAddress;

    // @dev DAO Base Info
    General public daoInfo;

    // @dev DAO Token Info
    Token public daoToken;

    // @dev DAO Governance
    Governance public daoGovernance;

    // @dev Manager
    // @dev contract owner: super admin
    mapping(address => bool) public admins;


    // @dev proposals slot
    uint256 public proposalIndex;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => VoteInfo[])) public voteInfos;

    mapping(uint256 => Airdrop) public airdrops;
    mapping(uint256 => mapping(address => bool)) private claimedMap;

    // @dev Event
    event Setting(uint256 indexed settingType);
    event Admin(address indexed admin, bool enable);
    event CreateProposal(uint256 indexed proposalId, address indexed proposer, uint256 nonce, uint256 startTime, uint256 endTime);
    event CancelProposal(uint256 indexed proposalId);
    event Vote(uint256 indexed proposalId, address indexed voter, uint256 indexed optionIndex, uint256 amount, uint256 nonce);

    event CreateAirdrop(address indexed creator, address indexed airdropId, address token, uint256 amount, bytes32 merkleRoot, uint256 startTime, uint256 endTime);
    event Claimed(address indexed airdropId, uint256 index, address account, uint256 amount);

    // @dev Struct
    struct Proposal {
        bool cancel;
        address creator;
        string title;
        string introduction;
        string content;
        uint256 startTime;
        uint256 endTime;
        VotingType votingType;
        ProposalOption[] options;
    }

    struct ProposalOption {
        string name;
        uint256 amount;
    }

    struct VoteInfo {
        uint256 index;
        uint256 amount;
    }

    enum SignType { CreateProposal, Voting }
    struct SignInfo {
        uint256 chainId;
        address tokenAddress;
        uint256 balance;
        SignType signType;
    }

    struct ProposalInput {
        string title;
        string introduction;
        string content;
        uint256 startTime;
        uint256 endTime;
        VotingType votingType;
    }


    // @dev Modifier
    /**
     * @dev Throws if called by any account other than the owner or admin.
     */
    modifier onlyOwnerOrAdmin() {
        require(
            owner() == msg.sender || admins[msg.sender],
                "DAOBase: caller is not the owner or admin."
        );
        _;
    }


    //------------------------ initialize ------------------------//
    /**
     * @dev Initializes the contract by simple way.
     */
    function initialize(
        General calldata general_,
        Token calldata token_,
        Governance calldata governance_
    ) override external initializer {
        factoryAddress = msg.sender;
        OwnableUpgradeable.__Ownable_init();

        _setInfo(general_);
        _setToken(token_);
        _setGovernance(governance_);
    }


    //------------------------ owner or admin ------------------------//
    /**
     * @dev remove or add a admin.
     */
    function setAdmin(address admin_, bool enabled_) external onlyOwner {
        _setAdmin(admin_, enabled_);
    }

    function setInfo(General calldata general_) external onlyOwnerOrAdmin {
        _setInfo(general_);
    }

    function setGovernance(Governance calldata governance_) external onlyOwnerOrAdmin {
        _setGovernance(governance_);
    }


    //------------------------ public ------------------------//
    /**
     * @dev create proposal
     */
    function createProposal(
        ProposalInput calldata input_,  // avoid stack too deep
        string[] calldata options_,
        SignInfo calldata signInfo_,
        bytes calldata signature_
    ) external {
        Governance memory _governance = daoGovernance;
        require(
            input_.votingType != VotingType.Any &&
            (_governance.votingType == VotingType.Any || _governance.votingType == input_.votingType),
            'DAOBase: invalid voting type.'
        );
        uint256 _nonce = IDAOFactory(factoryAddress).increaseNonce(msg.sender);
        require(_verifySignature(_nonce, signInfo_, signature_), 'DAOBase: invalid signer.');
        require(signInfo_.balance >= _governance.proposalThreshold, 'DAOBase: insufficient balance');

        uint256 _endTime = input_.endTime;
        if (_governance.votingPeriod > 0) {
            _endTime = input_.startTime + _governance.votingPeriod;
        }
        require(input_.startTime < input_.endTime, 'DAOBase: startTime ge endTime.');
        require(options_.length > 0, 'DAOBase: dont have enough options.');

        uint256 _proposalIndex = proposalIndex;
        proposalIndex = _proposalIndex + 1;
        Proposal storage proposal = proposals[_proposalIndex];
        for (uint256 _index = 0; _index < options_.length; _index++) {
            proposal.options.push(ProposalOption({
                name: options_[_index],
                amount: 0
            }));
        }
        proposal.creator = msg.sender;
        proposal.title = input_.title;
        proposal.introduction = input_.introduction;
        proposal.content = input_.content;
        proposal.startTime = input_.startTime;
        proposal.endTime = input_.endTime;
        proposal.votingType = input_.votingType;

        emit CreateProposal(_proposalIndex, msg.sender, _nonce, input_.startTime, input_.endTime);
    }

    /**
     * @dev vote for proposal
     */
    function vote(
        uint256 proposalId_,
        uint256[] calldata optionIndexes_,
        uint256[] calldata amounts_,
        SignInfo calldata signInfo_,
        bytes calldata signature_
    ) external {
        Proposal memory _proposal = proposals[proposalId_];
        require(proposalIndex > proposalId_, 'DAOBase: proposal id not exists.');
        require(optionIndexes_.length == amounts_.length, 'DAOBase: invalid length.');
        require(voteInfos[msg.sender][proposalId_].length == 0, 'DAOBase: already voted.');

        uint256 _nonce = IDAOFactory(factoryAddress).increaseNonce(msg.sender);
        require(_verifySignature(_nonce, signInfo_, signature_), 'DAOBase: invalid signer.');
        require(block.timestamp > _proposal.startTime && block.timestamp <= _proposal.endTime, 'DAOBase: vote on a wrong time.');
        require(!_proposal.cancel, 'DAOBase: already canceled.');
        if (proposals[proposalId_].votingType == VotingType.Single)
            require(optionIndexes_.length == 1, 'DAOBase: invalid length.');

        uint256 _totalAmount = 0;
        uint256 _optionsLength = proposals[proposalId_].options.length;
        for (uint256 _index = 0; _index < optionIndexes_.length; _index++) {
            require(_optionsLength > optionIndexes_[_index], 'DAOBase: proposal option index not exists.');
            _totalAmount += amounts_[_index];
            proposals[proposalId_].options[optionIndexes_[_index]].amount += amounts_[_index];
            voteInfos[msg.sender][proposalId_].push(VoteInfo(optionIndexes_[_index], amounts_[_index]));

            emit Vote(proposalId_, msg.sender, optionIndexes_[_index], amounts_[_index], _nonce);
        }

        require(signInfo_.balance >= _totalAmount, 'DAOBase: insufficient balance');
    }

    /**
     * @dev Cancel an active proposal
     */
    function cancelProposal(uint256 proposalId_) external {
        Proposal memory _proposal = proposals[proposalId_];
        require(proposalIndex > proposalId_, 'DAOBase: proposal id not exists.');
        require(block.timestamp <= _proposal.endTime, 'DAOBase: already done.');
        require(msg.sender == _proposal.creator, 'DAOBase: sender is not creator.');
        require(!_proposal.cancel, 'DAOBase: already canceled.');

        proposals[proposalId_].cancel = true;
        emit CancelProposal(proposalId_);
    }

    //------------------------ public get ------------------------//
    function getProposalOptionById(uint256 proposalId_) external view returns (ProposalOption[] memory) {
        return proposals[proposalId_].options;
    }

    function getVoteInfoByAccountAndProposalId(address account_, uint256 proposalId_) external view returns (VoteInfo[] memory) {
        return voteInfos[account_][proposalId_];
    }

    //------------------------ private ------------------------//
    function _setAdmin(address admin_, bool enabled_) private {
        admins[admin_] = enabled_;

        emit Admin(admin_, enabled_);
    }

    function _setInfo(General calldata general_) private {
        daoInfo = general_;

        emit Setting(SETTING_TYPE_GENERAL);
    }

    function _setToken(Token calldata token_) private {
        daoToken = token_;

        emit Setting(SETTING_TYPE_TOKEN);
    }

    function _setGovernance(Governance calldata governance_) private {
        daoGovernance = governance_;

        emit Setting(SETTING_TYPE_GOVERNANCE);
    }

    function _verifySignature(uint256 nonce_, SignInfo calldata signInfo_, bytes calldata signature_) private view returns (bool) {
        if (signInfo_.chainId != daoToken.chainId || signInfo_.tokenAddress != daoToken.tokenAddress) {
            return false;
        }
        bytes32 _hash = ECDSAUpgradeable.toEthSignedMessageHash(
            keccak256(
                abi.encodePacked(
                    msg.sender,
                    nonce_,
                    signInfo_.chainId,
                    signInfo_.tokenAddress,
                    signInfo_.balance,
                    uint256(signInfo_.signType)
                )
            )
        );
        address _signer = ECDSAUpgradeable.recover(_hash, signature_);

        return IDAOFactory(factoryAddress).isSigner(_signer);
    }

    function createAirdrop(
        uint256 airdropId_,
        address token_,
        uint256 amount_,
        bytes32 merkleRoot_,
        uint256 startTime_,
        uint256 endTime_
    ) external onlyOwnerOrAdmin {
        require(airdrops[airdropId_].token == address(0), 'DAOFactory: duplicate airdrop id.');
        require(token_ != address(0), 'DAOFactory: not a valid token address.');
        require(endTime_ > startTime_, 'DAOFactory: invalid time.');

        IERC20Upgradeable(_airdrop.token).safeTransferFrom(msg.sender, address(this), amount_);
        airdrops[airdropId_] = Airdrop({
            token: token_,
            tokenReserve: amount_,
            merkleRoot: merkleRoot_,
            startTime: startTime_,
            endTime: endTime_,
            creator: msg.sender
        });

        emit CreateAirdrop(msg.sender, airdropId_, token_, amount_, merkleRoot_, startTime_, endTime_);
    }

    function isClaimed(uint256 airdropId_, address account_) public view returns (bool) {
        return claimedMap[airdropId_][account_];
    }

    function _setClaimed(uint256 airdropId_, address account_, uint256 amount_) private {
        claimedMap[airdropId_][account_] = true;
        airdrops[airdropId_].tokenReserve -= amount_;
    }

    function claimAirdrop(uint256 airdropId_, uint256 index_, address account_, uint256 amount_, bytes32[] calldata merkleProof_) external {
        Airdrop memory _airdrop = airdrops[airdropId_];
        require(_airdrop.token != address(0), 'DAOFactory: not a valid airdrop id.');
        require(block.timestamp > _airdrop.startTime, 'DAOFactory: cannot claim yet.');
        require(block.timestamp <= _airdrop.endTime, 'DAOFactory: airdrop already done.');
        require(!isClaimed(airdropId_, account_), 'DAOFactory: drop already claimed.');

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index_, account_, amount_));
        require(MerkleProofUpgradeable.verify(merkleProof_, _airdrop.merkleRoot, node), 'DAOFactory: invalid proof.');

        // Mark it claimed and send the token.
        _setClaimed(airdropId_, account_, amount_);
        IERC20Upgradeable(_airdrop.token).safeTransfer(account_, amount_);

        emit Claimed(airdropId_, index_, account_, amount_);
    }

    function recycleAirdrop(uint256 airdropId_) external {
        Airdrop memory _airdrop = airdrops[airdropId_];
        require(_airdrop.token != address(0), 'DAOFactory: not a valid airdrop id.');
        require(block.timestamp > _airdrop.endTime, 'DAOFactory: cannot recycle yet.');
        require(_airdrop.tokenReserve > 0, 'DAOFactory: claimed out.');

        airdrops[airdropId_].tokenReserve = 0;
        IERC20Upgradeable(_airdrop.token).safeTransfer(_airdrop.creator, _airdrop.tokenReserve);
    }

}