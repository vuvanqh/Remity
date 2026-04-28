import {
    ColumnType,
    Insertable,
    Selectable,
} from 'kysely'


export interface WalletsTable {
    id: string
    createdAt: ColumnType<Date, Date | undefined, never>
}

export type Wallet = Selectable<WalletsTable>;
export type NewWallet = Insertable<WalletsTable>;