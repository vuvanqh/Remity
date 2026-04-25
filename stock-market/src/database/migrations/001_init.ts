import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>) {

  // Wallets
  await db.schema
    .createTable('wallets')
    .addColumn('id', 'varchar(255)', col =>
      col.primaryKey()
    )
    .addColumn('createdAt', 'datetime', col =>
      col.notNull()
      .defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()


  // Stocks
  await db.schema
    .createTable('stocks')
    .addColumn('name', 'varchar(255)', col =>
      col.primaryKey()
    )
    .addColumn('availableQuantity', 'integer', col =>
      col.notNull()
    )
    .execute()


  // WalletStocks (many-to-many join table)
  await db.schema
    .createTable('walletStocks')
    .addColumn('walletId', 'varchar(255)', col =>
      col.notNull()
      .references('wallets.id')
      .onDelete('cascade')
    )
    .addColumn('stockName', 'varchar(255)', col =>
      col.notNull()
      .references('stocks.name')
      .onDelete('cascade')
    )
    .addColumn('quantity', 'integer', col =>
      col.notNull()
    )
    .addPrimaryKeyConstraint(
      'pk_wallet_stocks',
      ['walletId', 'stockName']
    )
    .execute()


  // Audit Logs
  await db.schema
    .createTable('auditLogs')
    .addColumn('id', 'integer', col =>
      col.primaryKey()
      .identity()
    )
    .addColumn('action', 'varchar(10)', col =>
      col.notNull()
    )
    .addColumn('walletId', 'varchar(255)', col =>
      col.notNull()
      .references('wallets.id')
    )
    .addColumn('stockName', 'varchar(255)', col =>
      col.notNull()
      .references('stocks.name')
    )
    .addColumn('createdAt', 'datetime', col =>
      col.notNull()
      .defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('auditLogs').ifExists().execute()
  await db.schema.dropTable('walletStocks').ifExists().execute()
  await db.schema.dropTable('stocks').ifExists().execute()
  await db.schema.dropTable('wallets').ifExists().execute()
}