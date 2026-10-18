import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TransactionService } from './transaction.service.js';
import { TransactionRepository } from './transaction.repository.js';
import { KafkaService } from '../../config/kafka/kafka.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { GetTransactionsFilterDto } from './dto/get-transactions-filter.dto.js';
import {
  BalanceChanedStatus,
  EventNameEnum,
  TransactionStatus,
  TransactionType,
} from './transaction.types.js';

describe('TransactionService', () => {
  const repository = {
    createTransaction: vi.fn(),
    updateStatus: vi.fn(),
    findById: vi.fn(),
    findByParams: vi.fn(),
  };
  const kafka = { produce: vi.fn() };
  let service: TransactionService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: TransactionRepository, useValue: repository },
        { provide: KafkaService, useValue: kafka },
      ],
    }).compile();
    service = module.get(TransactionService);
    repository.createTransaction.mockResolvedValue({ id: 't1' });
  });

  it.each([TransactionType.DEPOSIT, TransactionType.WITHDRAWL])(
    'saves %s and emits TransactionSaved',
    async (transactionType) => {
      await service.create({ userId: 'u1', amount: '100', transactionType });
      expect(repository.createTransaction).toHaveBeenCalledWith({
        userId: 'u1',
        amount: '100',
        type: transactionType,
      });
      expect(kafka.produce).toHaveBeenCalledWith({
        eventName: EventNameEnum.TransactionSaved,
        data: {
          userId: 'u1',
          amount: '100',
          transactionType,
          transactionId: 't1',
        },
      });
    },
  );

  it('starts a transfer with only the withdrawal', async () => {
    await service.create({
      userId: 'u1',
      amount: '100',
      transactionType: TransactionType.TRANSFER,
      recipient: 'u2',
    });
    expect(repository.createTransaction).toHaveBeenCalledTimes(1);
    expect(repository.createTransaction).toHaveBeenCalledWith({
      userId: 'u1',
      amount: '-100',
      type: TransactionType.TRANSFER,
    });
    expect(kafka.produce).toHaveBeenCalledWith({
      eventName: EventNameEnum.TransactionSaved,
      data: {
        userId: 'u1',
        amount: '100',
        transactionType: TransactionType.WITHDRAWL,
        transactionId: 't1',
        recipient: 'u2',
      },
    });
  });

  it('credits the recipient only after a completed withdrawal', async () => {
    await service.updateStatus({
      transactionId: 't0',
      status: BalanceChanedStatus.COMPLETED,
      recipient: 'u2',
      amount: '100',
    });
    expect(repository.updateStatus).toHaveBeenCalledWith(
      't0',
      TransactionStatus.COMPLETED,
    );
    expect(repository.createTransaction).toHaveBeenCalledWith({
      userId: 'u2',
      amount: '100',
      type: TransactionType.TRANSFER,
    });
    expect(kafka.produce).toHaveBeenCalledWith({
      eventName: EventNameEnum.TransactionSaved,
      data: {
        userId: 'u2',
        amount: '100',
        transactionId: 't1',
        transactionType: TransactionType.DEPOSIT,
      },
    });
  });

  it('does not credit the recipient when the withdrawal fails', async () => {
    await service.updateStatus({
      transactionId: 't0',
      status: BalanceChanedStatus.FAILED,
      recipient: 'u2',
      amount: '100',
    });
    expect(repository.updateStatus).toHaveBeenCalledWith(
      't0',
      TransactionStatus.FAILED,
    );
    expect(repository.createTransaction).not.toHaveBeenCalled();
    expect(kafka.produce).not.toHaveBeenCalled();
  });

  it('finishes a normal transaction without starting another transfer', async () => {
    await service.updateStatus({
      transactionId: 't0',
      status: BalanceChanedStatus.COMPLETED,
    });
    expect(repository.createTransaction).not.toHaveBeenCalled();
  });

  it.each([undefined, 'u1'])(
    'rejects an absent or identical recipient (%s)',
    async (recipient) => {
      await expect(
        service.create({
          userId: 'u1',
          amount: '100',
          transactionType: TransactionType.TRANSFER,
          recipient,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createTransaction).not.toHaveBeenCalled();
    },
  );

  it('returns 404 for an unknown transaction', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.getTransaction('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps the HTTP transactionType filter to the repository type', async () => {
    await service.getTransactions({
      transactionType: TransactionType.TRANSFER,
      take: 20,
      skip: 0,
    });
    expect(repository.findByParams).toHaveBeenCalledWith({
      type: TransactionType.TRANSFER,
      take: 20,
      skip: 0,
    });
  });
});

describe('Transaction HTTP validation', () => {
  const userId = '6de20bd4-a1c6-43d1-b545-8532e7b3c718';

  it.each(['0', '-1', '1.5', 'NaN', 'Infinity'])(
    'rejects invalid amount %s',
    async (amount) => {
      const dto = plainToInstance(CreateTransactionDto, {
        userId,
        amount,
        transactionType: TransactionType.DEPOSIT,
      });
      expect(
        (await validate(dto)).some((error) => error.property === 'amount'),
      ).toBe(true);
    },
  );

  it('requires a recipient for TRANSFER', async () => {
    const dto = plainToInstance(CreateTransactionDto, {
      userId,
      amount: '100',
      transactionType: TransactionType.TRANSFER,
    });
    expect(
      (await validate(dto)).some((error) => error.property === 'recipient'),
    ).toBe(true);
  });

  it('accepts a deposit and normalizes single-value array filters', async () => {
    expect(
      await validate(
        plainToInstance(CreateTransactionDto, {
          userId,
          amount: '100',
          transactionType: TransactionType.DEPOSIT,
        }),
      ),
    ).toEqual([]);
    const filters = plainToInstance(GetTransactionsFilterDto, {
      userIds: userId,
      amounts: '100',
      take: '20',
      skip: '0',
    });
    expect(filters.userIds).toEqual([userId]);
    expect(filters.amounts).toEqual(['100']);
    expect(filters.take).toBe(20);
    expect(await validate(filters)).toEqual([]);
  });
});
