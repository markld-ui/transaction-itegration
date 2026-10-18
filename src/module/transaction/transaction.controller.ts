import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { TransactionDto } from './dto/transaction.dto.js';
import { GetTransactionsFilterDto } from './dto/get-transactions-filter.dto.js';
import { TransactionEntity } from './entities/transaction.entity.js';

@Controller()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto): Promise<void> {
    return this.transactionService.create(dto);
  }

  @Get(':id')
  async getOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TransactionEntity | null> {
    return this.transactionService.getTransaction(id);
  }

  @Get()
  async getTransactions(@Query() query: GetTransactionsFilterDto): Promise<{
    items: TransactionDto[];
    total: number;
  }> {
    return this.transactionService.getTransactions(query);
  }
}
