import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
import { TransactionKafkaController } from './transaction.kafka-controller.js';
import { TransactionRepository } from './transaction.repository.js';
import { KafkaModule } from '../../config/kafka/kafka.module.js';
import { TransactionEntity } from './entities/transaction.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    ConfigModule,
    KafkaModule,
  ],
  controllers: [TransactionController, TransactionKafkaController],
  providers: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
