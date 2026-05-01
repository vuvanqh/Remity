import { Module } from "@nestjs/common";
import { WalletStockRepository } from "./wallet-stock.repository";

@Module({
    providers: [WalletStockRepository],
    exports: [WalletStockRepository],
})
export class WalletStockModule{}