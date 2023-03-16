// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./VendingMachine.sol";

contract DAO {
    address public chairperson;
    address payable public VendingMachineAddress;
    uint public voteEndTime;
    uint public DAObalance;
    mapping(address => uint) balances;
    uint public decision;
    bool public ended;
    
    struct Voter {
        uint weight;
        bool voted;
        address delegate;
        uint vote;
    }

    struct Proposal {
        string name;
        uint voteCount;
    }

    mapping(address => Voter) voters;
    Proposal[] public proposals;

    error voteAlreadyEnded();
    error voteNotYetEnded();

    constructor(
        address payable _VendingMachineAddress,
        uint _voteTime,
        string[] memory proposalNames
    ) {

        VendingMachineAddress = _VendingMachineAddress;
        chairperson = msg.sender;
        
        voteEndTime = block.timestamp + _voteTime;
        voters[chairperson].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {

            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    // modifier tokenHoldersOnly() {
    //     require(token.balanceOf(msg.sender) >= 10**token.decimals());
    //     _;
    // }

    function Deposit() public payable {
        DAObalance = address(this).balance;
        
        if (block.timestamp > voteEndTime) {
            revert voteAlreadyEnded();
        }
        require(DAObalance <= 1 ether, "1 Ether balance has been reached"); //Here need to change ETH on TAN token, but how??
        
        balances[msg.sender] += msg.value;
    }

    function giveRightToVote(address voter) public {
        require(
            msg.sender == chairperson,
            "Only chairperson can give right to vote."
        );
        require(
            !voters[voter].voted,
            "The voter already voted."
        );
        require(voters[voter].weight == 0);
        voters[voter].weight = 1;
    }

    function vote(uint proposal) public {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;
        proposals[proposal].voteCount += sender.weight;
    }

    function countVote() public returns (uint winningProposal_) {
        require(block.timestamp > voteEndTime, "Vote not yet ended.");
        
        uint winningVoteCount = 0;

        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
                
                decision = winningProposal_;
                ended = true;
            }
        }
    }

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "amount > balance");

        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        DAObalance = address(this).balance;
    }

    function EndVote() public {
        require(
            block.timestamp > voteEndTime,
            "Vote not yet ended.");
          
        require(
            ended == true,
            "Must count vote first");  
            
        require(
            DAObalance >= 1 ether,
            "Not enough balance in DAO required to buy cookie. Members may withdraw deposited ether.");
            
        require(
            decision == 0,
            "DAO decided to not buy cookies. Members may withdraw deposited ether."); 
            
        if (DAObalance < 1 ether) revert();
            (bool success, ) = address(VendingMachineAddress).call{value: 1 ether}(abi.encodeWithSignature("purchase(uint)", 1));
            require(success, "Failed to purchase cookie from vending machine.");
            
        DAObalance = address(this).balance;
  
    }

    function checkCookieBalance() public view returns (uint) {
        VendingMachine vendingMachine = VendingMachine(VendingMachineAddress);
        return vendingMachine.cookieBalances(address(this));
    }
}