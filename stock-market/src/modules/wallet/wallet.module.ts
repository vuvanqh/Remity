import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletRepository } from "./wallet.repository";
import { WalletService } from "./wallet.service";
import { StockModule } from "../stock/stock.module";
import { TradePolicy } from "./policies/trade.policy";


@Module({
    controllers: [WalletController],
    providers: [WalletRepository, WalletService, TradePolicy],
    imports: [StockModule],
})
export class WalletModule{}