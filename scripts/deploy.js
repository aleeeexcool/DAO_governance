const hre = require("hardhat")

async function main() {
    const VendingMachine = await hre.ethers.getContractFactory('VendingMachine')
    const machine = await VendingMachine.deploy()

    await machine.deployed()

    const proposals = ['buy_cookie', 'no_cookie']

    const DAO = await ethers.getContractFactory('DAO')
    const dao = await DAO.deploy()

    await dao.deployed(machine.address, 86400, proposals)

    console.log("DAO contract deployed to: ", dao.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
