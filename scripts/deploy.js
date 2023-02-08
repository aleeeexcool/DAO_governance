const hre = require("hardhat")
const ethers = hre.ethers


async function main() {
  const [signer, user1, user2] = await ethers.getSigners()

  const Erc = await ethers.getContractFactory('TANShop', signer)
  const erc = await Erc.deploy()
  await erc.deployed()
  console.log(erc.address)
  console.log(await erc.token())

  const Governance = await ethers.getContractFactory('Governance', signer, user1, user2)
  const governance = await Governance.deploy()
  await erc.deployed()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
