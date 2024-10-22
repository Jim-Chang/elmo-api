# elmo-api

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Prerequisites

- Node version: 18.20.4
- [Install pnpm](https://pnpm.io/cli/install)
- 放置 `env.local` 至 `/envs` 文件夾


## Development

Install dependencies
```bash
$ pnpm install
```

DB Migration
```bash
$ pnpm mikro-orm migration:up
```

Start to develop:
```bash
$ pnpm run start:dev
```


## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```