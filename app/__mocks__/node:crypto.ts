let __verifyResult = true

export const __Verify: Partial<
  ReturnType<typeof import('node:crypto').createVerify>
> = {
  verify: jest.fn().mockImplementationOnce(() => __verifyResult),
  end: jest.fn().mockReturnThis(),
  write: jest.fn().mockReturnValue(true),
}

export function __setVerifyResult(verifyResult: boolean) {
  __verifyResult = verifyResult
}

export function createVerify() {
  return __Verify
}
