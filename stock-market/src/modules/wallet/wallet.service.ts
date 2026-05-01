    import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
    import { WalletRepository } from "./wallet.repository";
    import { StockRepository } from "../stock/stock.repository";
    import { db } from "../../database/kysely.provider";
    import { WalletResponse } from "./dtos/walletResponse"; 
    import { AuditLogRepository } from "../audit-logs/audit-log.repository";

    @Injectable()
    export class WalletService {
        constructor(
            private readonly walletRepository: WalletRepository,
            private readonly stockRepository: StockRepository,
            private readonly auditLogRepository: AuditLogRepository,
        ) {}
        
    //#region i guess something like this
        public getWalletStocks = async (wallet_id: string): Promise<WalletResponse> => {    
            const wallet = await this.walletRepository.findWalletById(wallet_id);
            if (!wallet) 
                throw new NotFoundException('Wallet not found');

            const walletStock = await this.walletRepository.getWalletStocks(wallet_id);
            return {
                id: wallet_id,
                stocks: walletStock.map(stock => ({
                    name: stock.stock_name,
                    quantity: stock.quantity,
                }))
            };  
        }

        public getWalletStockQuantity = async (wallet_id: string, stock_name: string): Promise<number> => {
            const wallet = await this.walletRepository.findWalletById(wallet_id);
            if (!wallet) 
                throw new NotFoundException('Wallet not found');

            return (await this.walletRepository.getWalletStockQuantity(wallet_id, stock_name))??0;
        }
    //#endregion

        public async buyStock(wallet_id: string, stock_name: string): Promise<void> {
            await db.transaction()
            .setIsolationLevel('read committed')
            .execute(async trx => {
                const wallet = await this.walletRepository.findWalletById(wallet_id, trx);

                if (!wallet) 
                    await this.walletRepository.createWallet(wallet_id, trx); 
                
                const res = await this.stockRepository.decrementStockQuantity(stock_name, trx);

                if(res==undefined)
                    throw new NotFoundException(`Stock ${stock_name} does not exist`);
                if(res===0)
                    throw new BadRequestException(`Stock ${stock_name} is not available`);


                await this.walletRepository.incrementWalletStock(wallet_id, stock_name, trx)             
                await this.auditLogRepository.createAuditLog({
                    type: "buy",
                    wallet_id,
                    stock_name
                }, trx);
            });
        }

        public async sellStock(wallet_id: string, stock_name: string): Promise<void> {
            await db.transaction()
            .setIsolationLevel('read committed')
            .execute(async trx => {   
                const wallet = await this.walletRepository.findWalletById(wallet_id, trx);

                if (!wallet) //we could remove this to promote lazy creation on buy and decrease latency but to stay compliant with the requirements I'll keep this code for the time being.
                {
                    await this.walletRepository.createWallet(wallet_id, trx); 
                    throw new BadRequestException(`Wallet does not have sufficient amount of stock '${stock_name}' to sell`);
                }

                const res = await this.walletRepository.decrementWalletStock(wallet_id, stock_name, trx);
                if(res==0)
                    throw new BadRequestException(`Wallet does not have sufficient amount of stock '${stock_name}' to sell`);

                const stock_res = await this.stockRepository.incrementStockQuantity(stock_name, trx);
                if(!stock_res)
                    throw new NotFoundException(`Stock ${stock_name} does not exist`);

                await this.auditLogRepository.createAuditLog({
                    type: "sell",
                    wallet_id,
                    stock_name,
                }, trx);
            });
            
        }
    }