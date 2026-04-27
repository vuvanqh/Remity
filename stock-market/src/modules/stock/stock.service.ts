import { StockRepository } from "./stock.repository";
import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "../../database/kysely.provider";
import { SetStockRequestDto } from "./dtos/stockRequestDto";
import { StockResponseDto } from "./dtos/stockResponseDto";

@Injectable()
export class StockService{
    constructor(
        private readonly stockRepository: StockRepository,
    ) {}

    public async setStocks(stocks: SetStockRequestDto[]) {
        await db.transaction().execute(async tsx=>{
            for(const stock of stocks) {
                    const st = await this.stockRepository.findStockByNameAsync(stock.name, tsx);
                    if (!st) {
                        await this.stockRepository.createStock({
                            name: stock.name,
                            quantity: stock.quantity,
                        }, tsx);
                    } else {
                        await this.stockRepository.setStock({
                            name: stock.name,
                            quantity: stock.quantity,
                        }, tsx);
                    }
                }
            }
        );
    }
    

    public async getStock(stockName: string): Promise<StockResponseDto> {
        const stock = await this.stockRepository.findStockByNameAsync(stockName);
        if(!stock)
            throw new NotFoundException('Stock does not exist');

        return {
            name: stock.name,
            quantity: stock.quantity,
        };
    }

    public async getStocks(): Promise<StockResponseDto[]> {
        const stocks =  await this.stockRepository.getAllStocks();

        return stocks.map(st => ({
            name: st.name,
            quantity: st.quantity,
        }));
    }

}