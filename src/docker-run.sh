#bin/bash

rm -rf db/migrations/*
npm run typeorm migration:create -- -n AutoGeneratedMigration
npm run typeorm migration:generate -- -n AutoGeneratedMigration
npm run typeorm migration:run
npm run start-dev