import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { Contract } from 'ethers'

const hre = require("hardhat");
const ethers = hre.ethers

export const getDb = () => low(new FileSync('./deployed-contracts.json')) // new LowSync(new JSONFileSync('./deployed-contracts.json'));

export const withSaveAndVerify = async <ContractType extends Contract>(
    instance: ContractType,
    id: string,
    args: (string | string[])[],
    verify?: boolean
  ): Promise<ContractType> => {
    await registerContractInJsonDb(id, instance);
    if (verify) {
      await verifyContract(id, instance.address, args);
    }
    return instance;
}

export const verifyContract = async (
    id: string,
    instanceAddr: string,
    args: (string | string[])[]) => {
      try {
          // 先等一会 否则有可能在链上还看不到合约地址
          console.log('verify %s at %s:', id, instanceAddr)
          await hre.run('verify:verify', {
            address: instanceAddr,
            constructorArguments: args
          })
      } catch (err) {
          console.log('verify %s failed', id, err)
      }
}

export const registerContractInJsonDb = async (contractId: string, contractInstance: Contract) => {
    const currentNetwork = hre.network.name;
    const FORK = process.env.FORK;
    if (FORK || (currentNetwork !== 'hardhat' && !currentNetwork.includes('coverage'))) {
      console.log(`*** ${contractId} ***\n`);
      console.log(`Network: ${currentNetwork}`);
      console.log(`tx: ${contractInstance.transactionHash}`);
      console.log(`contract address: ${contractInstance.address}`);
      // console.log(`deployer address: ${contractInstance.receipt.from}`);
      // console.log(`gas used: ${contractInstance.receipt.gasUsed}`);
      console.log(`\n******`);
      console.log();
    }
  
    getDb()
      .set(`${contractId}.${currentNetwork}`, {
        address: contractInstance.address,
        // deployer: contractInstance.receipt.from,
      })
      .write();
}

export const saveContractInJsonDb = async (contractId: string, addr: string) => {
    const currentNetwork = hre.network.name;

    getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: addr,
      // deployer: contractInstance.receipt.from,
    })
    .write();
}

export async function getImplementationAddress(proxyAddress) {
  const implHex = await ethers.provider.getStorageAt(
      proxyAddress,
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  );

  return ethers.utils.hexStripZeros(implHex);
}
