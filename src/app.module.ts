import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './module/database/database.module.js';
import { TransactionModule } from './module/transaction/transaction.module.js';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, TransactionModule],
})
export class AppModule {}
