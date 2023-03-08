const { ethers } = require('hardhat');

describe('VendingMachine', function () {
  let vendingMachine;

  beforeEach(async function () {
    const VendingMachine = await ethers.getContractFactory('VendingMachine');
    vendingMachine = await VendingMachine.deploy();
    await vendingMachine.deployed();
  });

  it('should purchase cookies from the vending machine', async function () {
    // Get the current balance of the contract and the caller
    const contractBalanceBefore = await ethers.provider.getBalance(vendingMachine.address);
    const callerBalanceBefore = await ethers.provider.getBalance(accounts[0]);

    // Purchase 5 cookies for 5 ether
    const cookiePrice = ethers.utils.parseEther('1');
    const numCookiesToBuy = 5;
    const amountToSend = cookiePrice.mul(numCookiesToBuy);
    await vendingMachine.purchase(numCookiesToBuy, { value: amountToSend });

    // Get the updated balance of the contract and the caller
    const contractBalanceAfter = await ethers.provider.getBalance(vendingMachine.address);
    const callerBalanceAfter = await ethers.provider.getBalance(accounts[0]);

    // Check that the contract balance increased by the amount sent
    const expectedContractBalance = contractBalanceBefore.add(amountToSend);
    assert.equal(expectedContractBalance.toString(), contractBalanceAfter.toString(), 'Contract balance incorrect');

    // Check that the caller's balance decreased by the amount sent plus gas fees
    const gasPrice = await ethers.provider.getGasPrice();
    const gasUsed = 200000; // adjust this value based on actual gas used
    const expectedCallerBalance = callerBalanceBefore.sub(amountToSend).sub(gasPrice.mul(gasUsed));
    assert.equal(expectedCallerBalance.toString(), callerBalanceAfter.toString(), 'Caller balance incorrect');
  });
});
