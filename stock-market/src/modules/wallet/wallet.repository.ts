import { Injectable } from "@nestjs/common";
import { db } from "../../database/kysely.provider";
import type { NewWalletStock, WalletStock, WalletStockUpdate } from "../../database/types/wallet-stock.types";
import { DbExecutor } from "../../database/types/dbContext";
import { Wallet } from "../../database/types/wallet.types";

@Injectable()
export class WalletRepository {
    public findWalletById = async (walletId: string, exec: DbExecutor = db): Promise<Wallet | undefined> => {
        return await exec
        .selectFrom('wallets')
        .selectAll()
        .where('id', '=', walletId)
        .executeTakeFirst();
    }

    public getWalletStocks = async (walletId: string, exec: DbExecutor = db): Promise<WalletStock[]> => {
        return await exec
        .selectFrom('walletStocks')
        .selectAll()
        .where('walletId', '=', walletId)
        .execute();
    }

    public getWalletStockQuantity = async (walletId: string, stockName: string, exec: DbExecutor = db): Promise<number | undefined> => {
        return await exec
        .selectFrom('walletStocks')
        .select('quantity')
        .where('walletId', '=', walletId)
        .where('stockName', '=', stockName)
        .executeTakeFirst().then(res => res?.quantity);
    }

    public createWallet = async (id: string, exec: DbExecutor = db): Promise<void> => {
        await exec
        .insertInto('wallets')
        .values({
            id: id
        })
        .execute();
    }

    public updateWalletStock = async (walletStock: WalletStockUpdate, exec: DbExecutor = db): Promise<void> => {
        await exec
        .updateTable('walletStocks')
        .set({
            walletId: walletStock.walletId!,
            stockName: walletStock.stockName!,
            quantity: walletStock.quantity 
        })
        .where('walletId', '=', walletStock.walletId!)
        .where('stockName', '=', walletStock.stockName!)
        .execute();
    }

    public insertWalletStock = async (walletStock: NewWalletStock, exec: DbExecutor = db): Promise<void> => {
        await exec
        .insertInto('walletStocks')
        .values({
            walletId: walletStock.walletId,
            stockName: walletStock.stockName,
            quantity: walletStock.quantity,
        })
        .execute();
    }
}