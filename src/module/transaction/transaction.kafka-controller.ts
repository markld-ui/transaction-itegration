import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransactionService } from './transaction.service.js';
import {
  type EventBalanceChangedData,
  EventNameEnum,
} from './transaction.types.js';

@Controller()
export class TransactionKafkaController {
  constructor(private readonly transactionService: TransactionService) {}

  @EventPattern(EventNameEnum.BalanceChanged)
  async handletransactionSaved(
    @Payload() message: EventBalanceChangedData,
  ): Promise<void> {
    await this.transactionService.updateStatus(message);
  }
}
