import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletRepository } from "./wallet.repository";
import { WalletService } from "./wallet.service";
import { StockModule } from "../stock/stock.module";
import { TradePolicy } from "./policies/trade.policy";
import { AuditLogsModule } from "../audit-logs/audit-log.module";


@Module({
    controllers: [WalletController],
    providers: [WalletRepository, WalletService, TradePolicy],
    imports: [StockModule, AuditLogsModule],
})
export class WalletModule{}