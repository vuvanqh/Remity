import { Module } from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import { StockModule } from './modules/stock/stock.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AuditLogsModule } from './modules/audit-logs/audit-log.module';
import { ChaosController } from './modules/chaos/chaos.controller';


@Module({
  controllers: [ChaosController],
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
