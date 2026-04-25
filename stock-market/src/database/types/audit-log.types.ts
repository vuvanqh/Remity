import {
    Insertable,
    Selectable,
    Updateable,
    ColumnType,
    Generated,
} from 'kysely'

export interface AuditLogsTable {
    id: Generated<number>
    action: "buy" | "sell"
    walletId: string
    stockName: string
    createdAt: ColumnType<Date, Date, never>
}

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;
export type UpdateAuditLog = Updateable<AuditLogsTable>;
