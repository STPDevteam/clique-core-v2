//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.9;

contract Voting {
    
    event Voted(uint256 indexed proposalId, uint256[] optionId, uint256[] amount);

    function voting(uint256 proposalId, uint256[] calldata optionIds, uint256[] calldata amounts) external {
        // Notice: The backend need to verify everything
        emit Voted(proposalId, optionIds, amounts);
    }

}