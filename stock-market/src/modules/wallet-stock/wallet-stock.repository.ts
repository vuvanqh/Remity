import { Injectable } from "@nestjs/common";
import { db } from "../../database/kysely.provider";
import type { NewWalletStock, WalletStock, WalletStockUpdate } from "../../database/types/wallet-stock.types";
import { DbExecutor } from "../../database/types/dbContext";

const SQL_SERVER_ERRORS = {
  DUPLICATE_KEY_PK_OR_UNIQUE: 2627,
  DUPLICATE_KEY_UNIQUE_INDEX: 2601,
} 

@Injectable()
export class WalletStockRepository {
    public getWalletStocks = async (wallet_id: string, exec: DbExecutor = db): Promise<WalletStock[]> => {
        return await exec
        .selectFrom('walletStocks')
        .selectAll()
        .where('wallet_id', '=', wallet_id)
        .execute();
    }

    public getWalletStockQuantity = async (wallet_id: string, stock_name: string, exec: DbExecutor = db): Promise<number | undefined> => {
        return await exec
        .selectFrom('walletStocks')
        .select('quantity')
        .where('wallet_id', '=', wallet_id)
        .where('stock_name', '=', stock_name)
        .executeTakeFirst().then(res => res?.quantity);
    }

    public updateWalletStock = async (walletStock: WalletStockUpdate, exec: DbExecutor) => {
        const results = await exec
        .updateTable('walletStocks')
        .set({
            quantity: walletStock.quantity 
        })
        .where('wallet_id', '=', walletStock.wallet_id!)
        .where('stock_name', '=', walletStock.stock_name!)
        .execute();
        return results?.reduce((sum, res) => sum + Number(res.numChangedRows??0),0);
    }

    public incrementWalletStock = async (wallet_id: string, stock_name: string, exec: DbExecutor): Promise<number> => {
        const updateQuery = () => exec
        .updateTable('walletStocks')
        .set((eb) => {
            return {
                quantity: eb('quantity', '+', 1)
            }
        })
        .where('wallet_id', '=', wallet_id)   
        .where('stock_name', '=', stock_name)
        .executeTakeFirst()
        
        const res = await updateQuery();
        const rowsAffected = Number(res?.numChangedRows??0);
        if(rowsAffected>0) return rowsAffected;

        try {
            await this.insertWalletStock({
                wallet_id: wallet_id,
                stock_name: stock_name,
            }, exec);
            return 1;
        } catch (error: any) {
            if(error?.number !== SQL_SERVER_ERRORS.DUPLICATE_KEY_PK_OR_UNIQUE
                && error?.number !== SQL_SERVER_ERRORS.DUPLICATE_KEY_UNIQUE_INDEX
            ) throw error;

            const res = await updateQuery();
            return Number(res[0]?.numChangedRows ?? 0);
        }
    }

    public decrementWalletStock = async (wallet_id: string, stock_name: string, exec: DbExecutor): Promise<number> => {
        const res = await exec
        .updateTable('walletStocks')
        .set((eb) => {
            return {
                quantity: eb('quantity', '-', 1)
            }
        })
        .where('wallet_id', '=', wallet_id)   
        .where('stock_name', '=', stock_name)
        .where('quantity', '>', 0)
        .execute();
        return Number(res[0]?.numChangedRows ?? 0)
    }


    public insertWalletStock = async (walletStock: Partial<NewWalletStock>, exec: DbExecutor): Promise<void> => {
        await exec
        .insertInto('walletStocks')
        .values({
            wallet_id: walletStock.wallet_id!,
            stock_name: walletStock.stock_name!,
            quantity: 1,
        })
        .execute();
    }
}