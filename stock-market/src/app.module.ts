import { Module } from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import { StockModule } from './modules/stock/stock.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AuditLogsModule } from './modules/audit-logs/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StockModule,
    WalletModule,
    AuditLogsModule
  ],
})

export class AppModule {}
