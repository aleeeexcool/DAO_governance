const { expect } = require("chai")
const { ethers, network } = require("hardhat")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO", function () {
    async function deploy() {
        const [deployer, account1, account2, account3] = await ethers.getSigners();
    
        const DigitalVendingMachine = await ethers.getContractFactory("DigitalVendingMachine");
        const machine = await DigitalVendingMachine.deploy();
    
        const proposals = ['buy_cupcake', 'no_cupcakes']
    
        const SimpleDAO = await ethers.getContractFactory("simpleDAO");
        const dao = await SimpleDAO.deploy(machine.address, 86400, proposals);
    
        for (let i = 1; i<4; i++) {
            let voters = await ethers.getSigners();
            await dao.giveRightToVote(voters[i].address);
        }
    
        return { dao, machine, deployer, account1, account2, account3 };
      }
})