//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.9;

import './interfaces/IDAOBase.sol';
import './interfaces/IDAOFactory.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract DAOBase is OwnableUpgradeable, IDAOBase {
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

    // @dev Event
    event Setting(uint256 indexed settingType);
    event Admin(address indexed admin, bool enable);
    event CreateProposal(uint256 indexed proposalId, address indexed proposer, uint256 nonce, uint256 startTime, uint256 endTime);
    event CancelProposal(uint256 indexed proposalId);
    event Vote(uint256 indexed proposalId, address indexed voter, uint256 indexed optionIndex, uint256 amount, uint256 nonce);

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

    enum SignType { CreateProposal, Voting }
    struct SignInfo {
        uint256 chainId;
        address tokenAddress;
        uint256 balance;
        SignType signType;
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
        string calldata title_,
        string calldata introduction_,
        string calldata content_,
        uint256 startTime_,
        uint256 endTime_,
        VotingType votingType_,
        string[] calldata options_,
        SignInfo calldata signInfo_,
        bytes calldata signature_
    ) external {
        Governance memory _governance = daoGovernance;
        require(
            votingType_ != VotingType.Any &&
            (_governance.votingType == VotingType.Any || _governance.votingType == votingType_),
            'DAOBase: invalid voting type.'
        );
        uint256 _nonce = IDAOFactory(factoryAddress).increaseNonce(msg.sender);
        require(_verifySignature(_nonce, signInfo_, signature_), 'DAOBase: invalid signer.');
        require(signInfo_.balance >= _governance.proposalThreshold, 'DAOBase: insufficient balance');

        if (_governance.votingPeriod > 0) {
            endTime_ = startTime_ + _governance.votingPeriod;
        }
        require(startTime_ < endTime_, 'DAOBase: startTime ge endTime.');
        require(options_.length > 0, 'DAOBase: dont have enough options.');

        uint256 _proposalIndex = proposalIndex;
        Proposal storage proposal = proposals[_proposalIndex];
        for (uint256 _index = 0; _index < options_.length; _index++) {
            proposal.options.push(ProposalOption({
                name: options_[_index],
                amount: 0
            }));
        }
        proposal.creator = msg.sender;
        proposal.title = title_;
        proposal.introduction = introduction_;
        proposal.content = content_;
        proposal.startTime = startTime_;
        proposal.endTime = endTime_;
        proposal.votingType = votingType_;
        proposalIndex = _proposalIndex + 1;

        emit CreateProposal(_proposalIndex, msg.sender, _nonce, startTime_, endTime_);
    }

    /**
     * @dev vote for proposal
     */
    function vote(
        uint256 proposalId_,
        uint256[] calldata optionIndexes_,
        uint256[] calldata amount_,
        SignInfo calldata signInfo_,
        bytes calldata signature_
    ) external {
        Proposal memory _proposal = proposals[proposalId_];
        require(proposalIndex > proposalId_, 'DAOBase: proposal id not exists.');
        require(optionIndexes_.length == amount_.length, 'DAOBase: invalid length.');

        uint256 _nonce = IDAOFactory(factoryAddress).increaseNonce(msg.sender);
        require(_verifySignature(_nonce, signInfo_, signature_), 'DAOBase: invalid signer.');
        require(block.timestamp > _proposal.startTime && block.timestamp <= _proposal.endTime, 'DAOBase: vote on a wrong time.');
        require(!_proposal.cancel, 'DAOBase: already canceled.');
        if (proposals[proposalId_].votingType == VotingType.Single)
            require(optionIndexes_.length == 1, 'DAOBase: invalid length.');

        uint256 totalAmount = 0;
        uint256 optionsLength = proposals[proposalId_].options.length;
        ProposalOption[] storage proposalOptions = proposals[proposalId_].options;
        for (uint256 _index = 0; _index < optionIndexes_.length; _index++) {
            require(optionsLength > optionIndexes_[_index], 'DAOBase: proposal option index not exists.');
            totalAmount += amount_[_index];
            proposalOptions[optionIndexes_[_index]].amount += amount_[_index];

            emit Vote(proposalId_, msg.sender, optionIndexes_[_index], amount_[_index], _nonce);
        }

        require(signInfo_.balance >= totalAmount, 'DAOBase: insufficient balance');
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

}