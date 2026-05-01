import { Injectable } from "@nestjs/common";
import { StockService } from "./stock.service";
import { Body, Controller, Get, Post, HttpCode } from "@nestjs/common/decorators";
import { SetStockRequestDto } from "./dtos/stockRequestDto";

@Controller('stocks')
export class StockController {
    constructor(private readonly stockService: StockService) {}

    @Post()
    @HttpCode(200)
    public async setStocks(@Body('stocks') stocks: SetStockRequestDto[]) {
        await this.stockService.setStocks(stocks);
    }

    @Get()
    public async getStocks() {
        const stocks = await this.stockService.getStocks();
        return {stocks};
    }

}