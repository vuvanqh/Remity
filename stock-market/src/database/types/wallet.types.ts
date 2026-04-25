import {
    ColumnType,
    Insertable,
    Selectable,
} from 'kysely'


export interface WalletsTable {
    id: string
    createdAt: ColumnType<Date, Date, never>
}

export type Wallet = Selectable<WalletsTable>;
export type NewWallet = Insertable<WalletsTable>;