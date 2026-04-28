import { WalletsTable } from './wallet.types'
import { StocksTable } from './stock.types'
import { WalletStocksTable } from './wallet-stock.types'
import { AuditLogsTable } from './audit-log.types'
import { Kysely, Transaction } from 'kysely'

export interface Database {
    wallets: WalletsTable
    stocks: StocksTable
    walletStocks: WalletStocksTable
    auditLogs: AuditLogsTable
}

export type DbExecutor = Kysely<Database> | Transaction<Database>