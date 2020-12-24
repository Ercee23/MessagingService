export = {
    "type": "postgres",
    "host": process.env.PGUSER,
    "port": process.env.PGPORT,
    "username": process.env.PGUSER,
    "password": process.env.PGPASSWORD,
    "database": process.env.PGDATABASE,
    "synchronize": false,
    "migrationsTableName": "custom_migration_table",
    "entities": [
        "db/entities/*.ts"
    ],
    "subscribers": [
        "db/subscribers/*.ts"
    ],
    "migrations": [
        "db/migrations/*.ts"
    ],
    "cli": {
        "entitiesDir": "db/entities",
        "migrationsDir": "db/migrations",
        "subscribersDir": "db/subscribers"
    }
}