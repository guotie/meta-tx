import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, BigNumberish, utils } from 'ethers'

import { abi as forwarderABI } from './abi/Forwarder.json'

export async function forwardTx(
                forwardc: Contract,
                from: string,
                to: string,
                data: string,
                privateKey: string,
                value: BigNumberish
            ) {
    const nonce = await forwardc.getNonce(from)
    , req = {
      from,
      to,
      value,
      nonce,
      data,
    }
    , tosign = await forwardc.getDigest(from, to, value, nonce, data)
    , userkey = new utils.SigningKey(privateKey)
    , sig = userkey.signDigest(tosign)
    , sigs = utils.joinSignature(sig)
    
    await (await forwardc.execute(req, sigs, {value: value})).wait()
}

export async function getContractForwarder(addr: string, signer?: SignerWithAddress) {
    return new Contract(addr, forwarderABI, signer)
}
