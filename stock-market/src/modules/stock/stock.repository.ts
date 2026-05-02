import { db } from "../../database/kysely.provider";
import { Injectable } from "@nestjs/common";
import { NewStock, Stock } from "../../database/types/stock.types";
import { DbExecutor } from "../../database/types/dbContext";

@Injectable()
export class StockRepository {  
    public getAllStocks = async (exec: DbExecutor = db): Promise<Stock[]> => {
        return await exec
        .selectFrom('stocks')
        .selectAll()
        .execute();
    }
    public findStockByNameAsync = async (stockName: string, exec: DbExecutor = db): Promise<Stock | undefined>=> {
        return await exec
        .selectFrom('stocks')
        .selectAll()
        .where('name', '=', stockName)
        .executeTakeFirst();
    }

    public updateStockQuantity = async (stockName: string, quantity: number, exec: DbExecutor): Promise<void> => {
        await exec
        .updateTable('stocks')
        .set({
            name: stockName,
            quantity: quantity,
        })
        .where('name', '=', stockName)
        .execute();
    }

    public incrementStockQuantity = async (stockName: string, exec: DbExecutor): Promise<number> => {
        const res = await exec
        .updateTable('stocks')
        .set((eb) => {
            return {
                quantity: eb('quantity', '+', 1)
            }
        })
        .where('name', '=', stockName)
        .executeTakeFirst();
        return Number(res.numUpdatedRows);
    }

    public decrementStockQuantity = async (stockName: string, exec: DbExecutor): Promise<number> => {
        const res = await exec
        .updateTable('stocks')
        .set((eb) => {
            return {
                quantity: eb('quantity', '-', 1)
            }
        })
        .where('name', '=', stockName)
        .where('quantity', '>', 0)
        .executeTakeFirst();
        return Number(res.numUpdatedRows);
    }

    public createStock = async (stock: NewStock, exec: DbExecutor): Promise<void> => {
        await exec
        .insertInto('stocks')
        .values({
            name: stock.name,
            quantity: stock.quantity,
        })
        .execute();
    }

    public setStock = async (stock: NewStock, exec: DbExecutor): Promise<void> => {
        await exec
        .updateTable('stocks')
        .set({
            name: stock.name,
            quantity: stock.quantity,
        })
        .where('name', '=', stock.name)
        .execute();
    }
}