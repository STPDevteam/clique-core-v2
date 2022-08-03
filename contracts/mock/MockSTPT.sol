//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockSTPT is ERC20 {

    constructor() ERC20('Mock STPT', 'MSTSP') { }

    function mint() external {
        ERC20._mint(msg.sender, 100000000000000000000000);
    }

}
