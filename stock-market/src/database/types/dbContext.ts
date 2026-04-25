import { WalletsTable } from './wallet.types'
import { StocksTable } from './stock.types'
import { WalletStocksTable } from './wallet-stock.types'
import { AuditLogsTable } from './audit-log.types'

export interface Database {
    wallets: WalletsTable
    stocks: StocksTable
    walletStocks: WalletStocksTable
    auditLogs: AuditLogsTable
}
