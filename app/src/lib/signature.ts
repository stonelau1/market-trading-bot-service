import { FireblocksSDK, PeerType, TransactionOperation } from 'fireblocks-sdk'

export function genSignRequest(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string,
  owner: string,
  spender: string,
  value: string,
  nonce: string,
  deadline: string
) {
  return {
    type: 'EIP712',
    index: 0,
    content: {
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
        ],
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
      primaryType: 'Permit',
      domain: {
        name,
        version,
        chainId,
        verifyingContract,
      },
      message: {
        owner,
        spender,
        value,
        nonce,
        deadline,
      },
    },
  }
}

export async function requestSignEIP712Message(
  vaultAccountId: string,
  msg: any,
  fireblocks: FireblocksSDK,
  assetId: string
) {
  const { id } = await fireblocks.createTransaction({
    operation: TransactionOperation.TYPED_MESSAGE,
    assetId,
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: vaultAccountId,
    },
    note: 'Test EIP-712 Message',
    extraParameters: {
      rawMessageData: {
        messages: [msg],
      },
    },
  })
  return id
}
