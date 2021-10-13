const hre = require("hardhat");
const ethers = hre.ethers
const upgrades = hre.upgrades

import { verifyContract, saveContractInJsonDb, withSaveAndVerify, getImplementationAddress, registerContractInJsonDb } from './utils'

async function deployForwarder(verify = true) {
    const forwarder = await hre.ethers.getContractFactory("Forwarder");
    const proxyed = await upgrades.deployProxy(forwarder, [], {kind: 'uups'});

    await proxyed.deployed();
    
    const impls = await getImplementationAddress(proxyed.address)
    
    // 这里会卡住, 暂时移除 typechain
    await verifyContract('ForwarderImpl', impls, [])
    await saveContractInJsonDb('ForwarderImpl', impls)
    // 代理会自动被 etherscan verify
    await registerContractInJsonDb('Forwarder', proxyed)

    console.log('Forwarder proxy address: %s implement: %s', proxyed.address, impls)
}

async function upgradeForwarder(proxyAddrss: string) {
  const oldImpls = await getImplementationAddress(proxyAddrss)
  const forwarder = await ethers.getContractFactory("Forwarder");
  // const upgrades =
  // new implement contract
  const nc = await upgrades.upgradeProxy(proxyAddrss, forwarder);
  const newImpls = await getImplementationAddress(proxyAddrss)
  
  await verifyContract('ForwarderImpl', newImpls, [])
  saveContractInJsonDb('ForwarderImpl', newImpls)

  console.log('upgrade Contract Forwarder, old impls: %s new impls: %s', oldImpls, newImpls)
}

export {
    deployForwarder,
    upgradeForwarder,
}