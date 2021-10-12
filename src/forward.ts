import { Contract, BigNumberish, utils } from 'ethers'

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