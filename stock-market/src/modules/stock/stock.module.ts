import { Module } from "@nestjs/common";
import { StockController } from "./stock.controller";
import { StockRepository } from "./stock.repository";
import { StockService } from "./stock.service";

@Module({
    controllers: [StockController],
    providers: [StockRepository, StockService],
    exports: [StockRepository],
})
export class StockModule{};