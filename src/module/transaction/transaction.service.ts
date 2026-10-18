import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionRepository } from './transaction.repository.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { GetTransactionsFilterDto } from './dto/get-transactions-filter.dto.js';
import {
  BalanceChanedStatus,
  EventBalanceChangedData,
  EventNameEnum,
  EventTransactionSavedData,
  TransactionStatus,
  TransactionType,
} from './transaction.types.js';
import { TransactionEntity } from './entities/transaction.entity.js';
import { KafkaService } from '../../config/kafka/kafka.service.js';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(params: CreateTransactionDto): Promise<void> {
    const { userId, amount, transactionType, recipient } = params;
    if (transactionType === TransactionType.TRANSFER) {
      if (!recipient || recipient === userId)
        throw new BadRequestException('A different recipient is required');
      return await this.createTransferTransaction(params);
    }
    const transaction = await this.transactionRepository.createTransaction({
      userId,
      amount,
      type: transactionType,
    });
    const data: EventTransactionSavedData = {
      userId,
      amount,
      transactionId: transaction.id,
      transactionType,
    };
    await this.kafkaService.produce({
      eventName: EventNameEnum.TransactionSaved,
      data,
    });
  }

  async createTransferTransaction(params: CreateTransactionDto): Promise<void> {
    const { userId, amount, transactionType, recipient } = params;

    const transactionWithdrawl =
      await this.transactionRepository.createTransaction({
        userId,
        amount: '-' + amount,
        type: transactionType,
      });

    const dataWithdrawl: EventTransactionSavedData = {
      userId,
      amount,
      transactionId: transactionWithdrawl.id,
      transactionType: TransactionType.WITHDRAWL,
      recipient,
    };

    await this.kafkaService.produce({
      eventName: EventNameEnum.TransactionSaved,
      data: dataWithdrawl,
    });
  }

  async updateStatus(params: EventBalanceChangedData): Promise<void> {
    const { transactionId, status, recipient, amount } = params;

    let transactionStatus = TransactionStatus.COMPLETED;
    if (status == BalanceChanedStatus.FAILED) {
      transactionStatus = TransactionStatus.FAILED;
    }

    await this.transactionRepository.updateStatus(
      transactionId,
      transactionStatus,
    );

    if (status === BalanceChanedStatus.COMPLETED && recipient && amount) {
      const transactionDeposit =
        await this.transactionRepository.createTransaction({
          userId: recipient,
          amount: amount,
          type: TransactionType.TRANSFER,
        });

      const dataDeposit: EventTransactionSavedData = {
        userId: recipient,
        amount,
        transactionId: transactionDeposit.id,
        transactionType: TransactionType.DEPOSIT,
      };

      await this.kafkaService.produce({
        eventName: EventNameEnum.TransactionSaved,
        data: dataDeposit,
      });
    }
  }

  async getTransaction(id: string): Promise<TransactionEntity | null> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async getTransactions(params: GetTransactionsFilterDto): Promise<{
    items: TransactionEntity[];
    total: number;
  }> {
    const { transactionType, ...filters } = params;
    return this.transactionRepository.findByParams({
      ...filters,
      type: transactionType,
    });
  }
}
