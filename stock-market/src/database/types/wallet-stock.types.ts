import {
    Insertable,
    Selectable,
    Updateable,
} from 'kysely'

export interface WalletStocksTable {
    walletId: string
    stockName: string
    quantity: number
}

export type WalletStock = Selectable<WalletStocksTable>;
export type NewWalletStock = Insertable<WalletStocksTable>;
export type WalletStockUpdate = Updateable<WalletStocksTable>;