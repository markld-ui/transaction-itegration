import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, Matches, ValidateIf } from 'class-validator';
import { Expose } from 'class-transformer';
import { TransactionType } from '../transaction.types.js';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Идентификатор пользователя',
    type: String,
  })
  @IsUUID()
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Сумма в копейках',
    type: String,
  })
  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'amount must be a positive integer in kopecks',
  })
  @Expose()
  amount: string;

  @ApiProperty({
    description: 'Тип транзакции',
    required: true,
    enum: TransactionType,
  })
  @Expose()
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({
    description: 'Идентификатор получателя, если это перевод средств',
    type: String,
    required: false,
  })
  @ValidateIf(
    (dto: CreateTransactionDto) =>
      dto.transactionType === TransactionType.TRANSFER ||
      dto.recipient !== undefined,
  )
  @IsUUID()
  @Expose()
  recipient?: string;
}
