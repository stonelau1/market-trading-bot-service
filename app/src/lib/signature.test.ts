import { expect } from '@jest/globals'
import { genSignRequest } from './signature'

describe('genSignRequest', () => {
  test('create signature request correct', () => {
    const name = 'permit'
    const chainId = 1
    const TOKEN_ADDRESS = '0x172108A678dA88fb5f0645ED6Fc3f5045e232829'
    const vaultAddress = '0x172108A678dA88fb5f0645ED6Fc3f5045e232829'
    const DELEGATOR_ADDRESS = '0x172108A678dA88fb5f0645ED6Fc3f5045e232829'
    const amount = '1000000000000000000'
    const nonce = '1'
    const deadline = '1'

    const output = genSignRequest(
      name,
      '1',
      chainId,
      TOKEN_ADDRESS,
      vaultAddress as string, //  owner
      DELEGATOR_ADDRESS, // spender
      amount,
      nonce,
      deadline
    )

    expect(output).toEqual({
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
          name: 'permit',
          version: '1',
          chainId: 1,
          verifyingContract: '0x172108A678dA88fb5f0645ED6Fc3f5045e232829',
        },
        message: {
          owner: '0x172108A678dA88fb5f0645ED6Fc3f5045e232829',
          spender: '0x172108A678dA88fb5f0645ED6Fc3f5045e232829',
          value: '1000000000000000000',
          nonce: '1',
          deadline: '1',
        },
      },
    })
  })
})
