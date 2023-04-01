const { ethers } = require('hardhat');
const { assert, expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe('VendingMachine', function () {
    async function deploy() {
        const [owner, account1] = await ethers.getSigners();

        const VendingMachine = await ethers.getContractFactory('VendingMachine');
        vendingMachine = await VendingMachine.deploy();
        await vendingMachine.deployed();

        return { vendingMachine, owner, account1 };
  };

  it('should be an owner', async function () {
    const { vendingMachine, owner } = await loadFixture(deploy);

    expect(await vendingMachine.owner()).to.equal(owner.address);
  });

  it('should be reverted with "Only the owner can refill"', async function () {
    const { vendingMachine, account1 } = await loadFixture(deploy);

    expect(vendingMachine.connect(account1)).to.be.revertedWith('Only the owner can refill.');
  });

  it('owner can refill the balance', async function () {
    const { vendingMachine } = await loadFixture(deploy);

    const actualCookieBalanceBefore = await vendingMachine.cookieBalances(vendingMachine.address);
    expect(actualCookieBalanceBefore).to.equal(100, 'Initial cookie balance incorrect');

    const owner = await vendingMachine.owner();

    const numCookiesToAdd = 10;
    await vendingMachine.refill(numCookiesToAdd, { from: owner });

    const expectedCookieBalance = 100 + numCookiesToAdd;
    const actualCookieBalanceAfter = await vendingMachine.cookieBalances(vendingMachine.address);
    expect(actualCookieBalanceAfter).to.equal(expectedCookieBalance, 'Cookie balance incorrect');
  });

  it('should purchase cookies from the vending machine', async function () {
    const { vendingMachine } = await loadFixture(deploy);
    
    const contractBalanceBefore = await ethers.provider.getBalance(vendingMachine.address);

    const cookiePrice = ethers.utils.parseEther('1');
    const numCookiesToBuy = 5;
    const amountToSend = cookiePrice.mul(numCookiesToBuy);
    await vendingMachine.purchase(numCookiesToBuy, { value: amountToSend });

    const contractBalanceAfter = await ethers.provider.getBalance(vendingMachine.address);

    const expectedContractBalance = contractBalanceBefore.add(amountToSend);
    assert.equal(expectedContractBalance.toString(), contractBalanceAfter.toString(), 'Contract balance incorrect');
  });
});
