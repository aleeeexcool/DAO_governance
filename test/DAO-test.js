const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO", function () {
    async function deploy() {
        const [chairperson, account1, account2, account3] = await ethers.getSigners();
    
        const VendingMachine = await ethers.getContractFactory("VendingMachine");
        const machine = await VendingMachine.deploy();
    
        const proposals = ['buy_cookie', 'no_cookie']
    
        const DAO = await ethers.getContractFactory("DAO");
        const dao = await DAO.deploy(machine.address, 86400, proposals);
    
        return { dao, machine, chairperson, account1, account2, account3 };
    }

    describe('Deployment', function() {
        let voteEndTime;

        before(async () => {
            voteEndTime = Math.floor(Date.now() / 1000) + 600;
        });

        it('Shoud be have a deployer and machine address', async function() {
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

        it('should revert if called before the end of voting period', async function () {
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

        it('Should revert on double vote', async function () {
            const { dao, account1 } = await loadFixture(deploy);

            let voter = await dao.giveRightToVote(account1.address);

            const yes = 0;

            await dao.connect(account1).vote(yes);
            await expect(dao.connect(account1).vote(yes)).to.be.reverted;
        });

        it('Should revert if the balance has not enough funds', async function () {
            const { dao, account1 } = await loadFixture(deploy);

            await dao.connect(account1).Deposit({ value: ethers.utils.parseEther('1.0') });

            await expect(dao.connect(account1).withdraw(ethers.utils.parseEther('2.0'))).to.be.revertedWith('Insufficient funds on the balance!');
        });

        it('Should withdraw successfully when the balance is sufficient', async function () {
            const { dao, account1 } = await loadFixture(deploy);

            await dao.connect(account1).Deposit({ value: ethers.utils.parseEther('1.0') });

            await expect(dao.connect(account1).withdraw(ethers.utils.parseEther('1.0')));
        });

        it('should update the DAO balance after a withdrawal', async function () {
            const { dao, account1 } = await loadFixture(deploy);

            await dao.connect(account1).Deposit({ value: ethers.utils.parseEther('1.0') });
            const initialDAObalance = await ethers.provider.getBalance(dao.address);

            await dao.connect(account1).withdraw(ethers.utils.parseEther('0.5'));
            const finalDAObalance = await ethers.provider.getBalance(dao.address);

            expect(finalDAObalance).to.be.equal(initialDAObalance.sub(ethers.utils.parseEther('0.5')));
        });
        
        it('should not allow a non-chairperson to give the right to vote', async function () {
            const { dao, account3, account2 } = await loadFixture(deploy);
            
            await expect(dao.connect(account2).giveRightToVote(account3.address)).to.be.revertedWith('Only chairperson can give right to vote.');
        });

        it('should give the right to vote to a voter', async function () {
            const { dao, chairperson, account3 } = await loadFixture(deploy);

            await expect(await dao.connect(chairperson).giveRightToVote(account3.address));
        });

        it('should not allow a voter who has already voted to be given the right to vote', async function () {
            const { dao, chairperson, account2 } = await loadFixture(deploy);

            await dao.connect(chairperson).giveRightToVote(account2.address);
        
            await dao.connect(account2).vote(1);
        
            await expect(dao.giveRightToVote(account2.address)).to.be.revertedWith('The voter already voted.');
        });
        
        it('should not allow a voter who already has the right to vote to be given the right to vote again', async function () {
            const { dao, chairperson, account2 } = await loadFixture(deploy);

            await dao.connect(chairperson).giveRightToVote(account2.address);
        
            await expect(dao.giveRightToVote(account2.address)).to.be.revertedWith('You already have a right to vote.');
        });

        it('Should vote and return cookieBalance', async function () {
            const { dao, chairperson, account1, account2, account3 } = await loadFixture(deploy);
    
            const yes = 0;
            const no = 1;
    
            let amountPayable = {value: ethers.utils.parseEther("0.5")};
    
            await dao.connect(account1).Deposit(amountPayable);
            await dao.connect(account2).Deposit(amountPayable);

            await dao.connect(chairperson).giveRightToVote(account1.address);
            await dao.connect(chairperson).giveRightToVote(account2.address);
            await dao.connect(chairperson).giveRightToVote(account3.address);
    
            await dao.connect(account1).vote(yes);
            await dao.connect(account2).vote(yes);
            await dao.connect(account3).vote(no);
    
            await ethers.provider.send("evm_increaseTime", [(24 * 60 * 60) + 60]);
            await network.provider.send("evm_mine");
    
            await dao.countVote();
            let decision = await dao.decision();
    
            expect(decision).to.equal(0);
    
            await dao.EndVote();
    
            let cookieBalance = await dao.checkCookieBalance();
    
            expect(cookieBalance).to.equal(1);
    
            console.log("cookie balance: ", cookieBalance);
        });
    });
});
