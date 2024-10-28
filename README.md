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

## Seeding
ref [Seeding | MikroORM](https://mikro-orm.io/docs/seeding#factory-relationships)

Execute the seeder:run MikroORM CLI command to seed your database.
```bash
npx mikro-orm seeder:run
```
Drop all tables and re-run all of your migrations or generate the database based on the current entities. This command is useful for completely re-building your database:
```bash
npx mikro-orm migration:fresh --seed    # will drop the database, run all migrations and the DatabaseSeeder class

npx mikro-orm schema:fresh --seed       # will recreate the database and run the DatabaseSeeder class
```