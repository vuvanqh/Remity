import 'dotenv/config'
import { Migrator, FileMigrationProvider } from 'kysely'
import { db } from './kysely.provider'
import {promises} from 'fs'
import path from 'path'

async function migrateToLatest() {
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs: promises,
            path,
            migrationFolder: path.join(__dirname, 'migrations')
        })
    })

    const { error, results } = await migrator.migrateToLatest()

    results?.forEach(it => {
        console.log(`${it.status}: ${it.migrationName}`)
    })

    if (error) {
        console.error(error)
        process.exit(1)
    }

    process.exit(0)
}

migrateToLatest()