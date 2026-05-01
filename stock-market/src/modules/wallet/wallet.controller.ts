import { WalletService } from "./wallet.service";
import { Body, Controller, Get, Param, Post, HttpCode } from "@nestjs/common/decorators";
import { Injectable } from "@nestjs/common";
import { WalletStockOperationDto } from "./dtos/wallet-stock-operation.dto";


@Injectable()
@Controller('wallets')
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @Get(':wallet_id')
    public async getWalletStocks(@Param('wallet_id') wallet_id: string) {
        return await this.walletService.getWalletStocks(wallet_id);
    }

    //buy/sell stock
    @Post(':wallet_id/stocks/:stock_name')
    @HttpCode(200)
    public async manageWallet(
        @Param('wallet_id') wallet_id: string,
        @Param('stock_name') stock_name: string,
        @Body() operation: WalletStockOperationDto,
    ) {

        return operation.type === 'buy' ? 
        await this.walletService.buyStock(wallet_id, stock_name):
        await this.walletService.sellStock(wallet_id, stock_name);
    }

    @Get(':wallet_id/stocks/:stock_name')
    public async getWalletStockQuantity(
        @Param('wallet_id') wallet_id: string,
        @Param('stock_name') stock_name: string,
    ) {
        return await this.walletService.getWalletStockQuantity(wallet_id, stock_name);
    }
}