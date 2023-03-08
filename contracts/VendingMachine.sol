// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract VendingMachine {

    address public owner;
    mapping (address => uint) public cookieBalances;

    constructor() {
        owner = msg.sender;
        cookieBalances[address(this)] = 100;
    }

    function refill(uint amount) public {
        require(msg.sender == owner, "Only the owner can refill.");
        cookieBalances[address(this)] += amount;
    }

    function purchase(uint amount) public payable {
        require(msg.value >= amount * 1 ether, "You must pay at least 1 ETH per cookie");
        require(cookieBalances[address(this)] >= amount, "Not enough cookies in stock to complete this purchase");
        cookieBalances[address(this)] -= amount;
        cookieBalances[msg.sender] += amount;
    }
}