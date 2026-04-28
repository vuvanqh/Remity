import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { WalletRepository } from "./wallet.repository";
import { StockRepository } from "../stock/stock.repository";
import { db } from "../../database/kysely.provider";
import { WalletResponse } from "./dtos/walletResponse"; 
import { TradePolicy } from "./policies/trade.policy";


@Injectable()
export class WalletService {
    constructor(
        private readonly walletRepository: WalletRepository,
        private readonly stockRepository: StockRepository,
        private readonly tradePolicy: TradePolicy,
    ) {}

    public getWalletStocks = async (walletId: string): Promise<WalletResponse> => {
        const wallet = await this.walletRepository.findWalletById(walletId);
        if (!wallet) 
            throw new NotFoundException('Wallet not found');

        const walletStock = await this.walletRepository.getWalletStocks(walletId);
        return {
            id: walletId,
            stocks: walletStock.map(stock => ({
                name: stock.stockName,
                quantity: stock.quantity,
            }))
        };
    }

    public getWalletStockQuantity = async (walletId: string, stockName: string): Promise<number> => {
        const wallet = await this.walletRepository.findWalletById(walletId);
        if (!wallet) 
            throw new NotFoundException('Wallet not found');

        return await this.walletRepository.getWalletStockQuantity(walletId, stockName)??0;

    }

    //TODO: Add audit logging for buy and sell stock and locks on buy/sell and setStock
    public async buyStock(walletId: string, stockName: string): Promise<void> {
        await db.transaction().execute(async trx => {
            const stock = await this.stockRepository.findStockByNameAsync(stockName, trx);

            this.tradePolicy.ensureBuyAllowed(stock);
            const wallet = await this.walletRepository.findWalletById(walletId, trx);

            if (!wallet) 
                await this.walletRepository.createWallet(walletId, trx); 
            

            const quantity = await this.walletRepository.getWalletStockQuantity(walletId, stockName, trx);
            if(quantity == undefined)
                await this.walletRepository.insertWalletStock({
                    walletId,
                    stockName,
                    quantity: 1,
                }, trx);
            else 
                await this.walletRepository.updateWalletStock({
                    walletId,
                    stockName,
                    quantity: quantity + 1,
                }, trx);
            

            await this.stockRepository.updateStockQuantity(stockName, stock!.quantity - 1, trx);
        });
    }

     public async sellStock(walletId: string, stockName: string): Promise<void> {
        await db.transaction().execute(async trx => {
            const stock = await this.stockRepository.findStockByNameAsync(stockName, trx);
            const stockQuantity = await this.walletRepository.getWalletStockQuantity(walletId, stockName, trx)??0;
            this.tradePolicy.ensureSellAllowed(stock, stockQuantity);         
            
            const wallet = await this.walletRepository.findWalletById(walletId, trx);
            if (wallet == null)
                throw new NotFoundException('Wallet not found');    
            

            await this.walletRepository.updateWalletStock({
                walletId,
                stockName,
                quantity: stockQuantity - 1,
            }, trx);

            await this.stockRepository.updateStockQuantity(stockName, stock!.quantity + 1, trx);
        });
    }
}