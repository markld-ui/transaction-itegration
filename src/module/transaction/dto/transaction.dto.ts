import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { TransactionStatus, TransactionType } from '../transaction.types.js';

export class TransactionDto {
  @ApiProperty({
    description: 'Идентификатор транзакции',
    type: String,
  })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Идентификатор пользователя',
    type: String,
  })
  @IsString()
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Сумма в копейках',
    type: String,
  })
  @IsString()
  @Expose()
  amount: string;

  @ApiProperty({
    description: 'Тип транзакции',
    enum: TransactionType,
    required: false,
  })
  @Expose()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Статус транзакции',
    required: false,
    enum: TransactionStatus,
  })
  @Expose()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
