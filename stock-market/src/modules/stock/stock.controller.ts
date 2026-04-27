import { Injectable } from "@nestjs/common";
import { StockService } from "./stock.service";
import { Body, Controller, Get, Post } from "@nestjs/common/decorators";
import { SetStockRequestDto } from "./dtos/stockRequestDto";

@Controller('stocks')
export class StockController {
    constructor(private readonly stockService: StockService) {}

    @Post()
    public async setStocks(@Body('stocks') stocks: SetStockRequestDto[],
    ) {
        return await this.stockService.setStocks(stocks);
    }

    @Get()
    public async getStocks() {
        return await this.stockService.getStocks();
    }

}