const { expect, assert } = require("chai")
const { ethers, network } = require("hardhat")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO", function () {
    async function deploy() {
        const [account1, account2, account3] = await ethers.getSigners();
    
        const VendingMachine = await ethers.getContractFactory("VendingMachine");
        const machine = await VendingMachine.deploy();
    
        const proposals = ['buy_cookie', 'no_cookie']
    
        const DAO = await ethers.getContractFactory("DAO");
        const dao = await DAO.deploy(machine.address, 86400, proposals);
    
        for (let i = 1; i<4; i++) {
            let voters = await ethers.getSigners();
            await dao.giveRightToVote(voters[i].address);
        }
    
        return { dao, machine, account1, account2, account3 };
    }

    describe('Deployment', function() {
        let voteEndTime;

        before(async () => {
            voteEndTime = Math.floor(Date.now() / 1000) + 600;
        });

        it("Shoud be have a deployer and machine address", async function() {
            const { machine, dao } = await loadFixture(deploy);

            let machineAddr = await dao.VendingMachineAddress();

            expect(machineAddr).to.equal(machine.address);
        });

        it('Should deposit ETH and update balances', async () => {
            const { dao } = await loadFixture(deploy);

            const depositAmount = ethers.utils.parseEther("0.5");
            const initialBalance = await ethers.provider.getBalance(dao.address);
            await dao.Deposit({ value: depositAmount });
            const newBalance = await ethers.provider.getBalance(dao.address);

            expect(newBalance.sub(initialBalance)).to.equal(depositAmount);
        });

        it("should revert if called before the end of voting period", async function () {
            const { dao } = await loadFixture(deploy);

            await expect(dao.countVote()).to.be.revertedWith("Vote not yet ended.");
        });

        it('Should revert if the ETH balance limit has been reached', async () => {
            const { dao, account1 } = await loadFixture(deploy);

            const depositAmount = ethers.utils.parseEther('1', 'ether');
            await dao.Deposit({ value: depositAmount });

            const depositAmount2 = ethers.utils.parseEther('0.1', 'ether');
            expect(dao.connect(account1).Deposit({ value: depositAmount2 })).be.revertedWith('1 Ether balance has been reached');
        });

        it("Should revert on double vote", async function () {
            const { dao, account1 } = await loadFixture(deploy);

            const yes = 0;

            await dao.connect(account1).vote(yes);
            await expect(dao.connect(account1).vote(yes)).to.be.reverted;
        });

        it("Should revert if the balance has not enough funds", async function () {
            const { dao, account1 } = await loadFixture(deploy);

            //testing
        });
        
        //need to add test giveRightToVote()

        it("Should vote and return cookieBalance", async function () {
            const { dao, account1, account2, account3 } = await loadFixture(deploy);
    
            const yes = 0;
            const no = 1;
    
            let amountPayable = {value: ethers.utils.parseEther("0.5")};
    
            await dao.connect(account1).Deposit(amountPayable);
            await dao.connect(account2).Deposit(amountPayable);
    
            await dao.connect(account1).vote(yes);
            await dao.connect(account2).vote(yes);
            await dao.connect(account3).vote(no);
    
            await ethers.provider.send("evm_increaseTime", [(24 * 60 * 60) + 60]);
            await network.provider.send("evm_mine");
    
            await dao.countVote();
            let decision = await dao.decision();
    
            expect(decision).to.equal(0);
    
            await dao.EndVote();

            // let cookieBalance = await dao.checkCookieBalance();
            // await dao.connect(account1).checkCookieBalance();

            // expect(cookieBalance).to.equal(1);
    
            // let cookieBalance = await dao.checkCookieBalance();
    
            // expect(cookieBalance).to.equal(1);
    
            // console.log("cookie balance: ", cookieBalance);
        });
    });
});