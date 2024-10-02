import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'test',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/testSetup.ts'],
      testMatch: ['<rootDir>/**/!(*.redis).test.ts'],
    },
    {
      displayName: 'redis',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/testSetup.ts',
        '<rootDir>/testSetup.redis.ts',
      ],
      testMatch: ['<rootDir>/**/*.redis.test.ts'],
    },
  ],
}

export default config
