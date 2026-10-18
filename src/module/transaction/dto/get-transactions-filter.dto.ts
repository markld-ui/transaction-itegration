import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TransactionStatus, TransactionType } from '../transaction.types.js';

export class GetTransactionsFilterDto {
  @ApiProperty({
    description: 'Идентификаторы транзакций',
    type: [String],
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  ids?: string[];

  @ApiProperty({
    description: 'Идентификаторы пользователей',
    type: [String],
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  userIds?: string[];

  @ApiProperty({
    description: 'Сумма',
    type: [String],
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  amounts?: string[];

  @ApiProperty({
    description: 'Тип транзакции',
    required: false,
    enum: TransactionType,
  })
  @Expose()
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiProperty({
    description: 'Статус транзакции',
    required: false,
    enum: TransactionStatus,
  })
  @Expose()
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    type: Number,
    required: false,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  readonly take?: number;

  @ApiProperty({
    type: Number,
    required: false,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly skip?: number;
}
