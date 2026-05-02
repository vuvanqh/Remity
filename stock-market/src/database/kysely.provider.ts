import { Database } from './types/dbContext'
import * as tedious from 'tedious'
import * as tarn from 'tarn'
import { Kysely, MssqlDialect } from 'kysely'

const dialect = new MssqlDialect({
    tarn: {
        ...tarn,
        options: {
            min: 0,
            max: 10,
        },
    },
    tedious: {
        ...tedious,
        connectionFactory: () => new tedious.Connection({
            authentication:{
                options: {
                    userName: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                },
                type: 'default',
            },
            options: {
                database: process.env.DB_NAME?? 'StockMarketDB',
                encrypt: true,
                trustServerCertificate: true,
                port: Number(process.env.DB_PORT) || 1433,
            },
            server: process.env.DB_HOST?? 'localhost',
        }),
    },
})

export const db = new Kysely<Database>({
    dialect,
})