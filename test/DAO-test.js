const { expect } = require("chai")
const { ethers, network } = require("hardhat")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO", function () {
    async function deploy() {
        const [deployer, account1, account2, account3] = await ethers.getSigners();
    
        const VendingMachine = await ethers.getContractFactory("VendingMachine");
        const machine = await VendingMachine.deploy();
    
        const proposals = ['buy_cookie', 'no_cookie']
    
        const DAO = await ethers.getContractFactory("DAO");
        const dao = await DAO.deploy(machine.address, 86400, proposals);
    
        for (let i = 1; i<4; i++) {
            let voters = await ethers.getSigners();
            await dao.giveRightToVote(voters[i].address);
        }
    
        return { dao, machine, deployer, account1, account2, account3 };
    }

    describe("Deployment", function() {
        it("Shoud be have a deployer and machine address", async function() {
            const { machine, dao } = await loadFixture(deploy);

            let machineAddr = await dao.VendingMachineAddress();

            expect(machineAddr).to.equal(machine.address);
        });

        it("Account1 can make a deposit", async function() {
            const { account1, dao } = await loadFixture(deploy);
            let amountPayable = {value: ethers.utils.parseEther("0.5")};

            await dao.connect(account1).Deposit(amountPayable);
            // expect(dao.DAObalance).to.equal(amountPayable);
        });

        it("Should revert on double vote", async function(){
            const { dao, account1, account2, account3 } = await loadFixture(deploy);

            const yes = 0;

            await dao.connect(account1).vote(yes);
            await expect(dao.connect(account1).vote(yes)).to.be.reverted;
        });
    });
});