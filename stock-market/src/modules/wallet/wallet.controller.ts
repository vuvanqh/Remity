import { WalletService } from "./wallet.service";
import { Body, Controller, Get, Param, Post, HttpCode } from "@nestjs/common/decorators";
import { WalletStockOperationDto } from "./dtos/wallet-stock-operation.dto";
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiBody } from "@nestjs/swagger";

@ApiTags('wallets')
@Controller('wallets')
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @ApiOperation({
        summary: 'Get wallet state',
        description: 'Returns all stocks and their quantities for a given wallet.'
    })
    @ApiParam({
        name: 'wallet_id',
        description: 'Unique identifier of the wallet'
    })
    @ApiOkResponse({
        description: 'Wallet state retrieved successfully'
    })
    @ApiNotFoundResponse({
        description: 'Wallet does not exist'
    })
    @Get(':wallet_id')
    public async getWalletStocks(@Param('wallet_id') wallet_id: string) {
        return await this.walletService.getWalletStocks(wallet_id);
    }

    @Post(':wallet_id/stocks/:stock_name')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Buy or sell a stock',
        description: `
        Executes a single stock operation.

        - Creates wallet if it does not exist
        - Buy fails if stock is unavailable in the bank
        - Sell fails if wallet does not own the stock
        `
    })
    @ApiParam({
        name: 'wallet_id',
        description: 'Unique identifier of the wallet'
    })
    @ApiParam({
        name: 'stock_name',
        description: 'Name of the stock'
    })
    @ApiBody({
        type: WalletStockOperationDto,
        description: 'Operation type (buy or sell)'
    })
    @ApiOkResponse({
        description: 'Operation completed successfully'
    })
    @ApiBadRequestResponse({
        description: 'Invalid operation (e.g., insufficient stock)'
    })
    @ApiNotFoundResponse({
        description: 'Stock does not exist'
    })
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

    @ApiOperation({
        summary: 'Get wallet stock quantity',
        description: 'Returns quantity of a specific stock in a given wallet.'
    })
    @ApiParam({
        name: 'wallet_id',
        description: 'Unique identifier of the wallet'
    })
    @ApiParam({
        name: 'stock_name',
        description: 'Name of the stock'
    })
    @ApiOkResponse({
        description: 'Stock quantity retrieved successfully'
    })
    @ApiNotFoundResponse({
        description: 'Wallet does not exist'
    })
    @Get(':wallet_id/stocks/:stock_name')
    public async getWalletStockQuantity(
        @Param('wallet_id') wallet_id: string,
        @Param('stock_name') stock_name: string,
    ) {
        return await this.walletService.getWalletStockQuantity(wallet_id, stock_name);
    }
}