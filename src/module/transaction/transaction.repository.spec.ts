import { TransactionRepository } from './transaction.repository.js';
import { TransactionType } from './transaction.types.js';

it('builds PostgreSQL array filters with valid spread parameters', () => {
  const query = {
    andWhere: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
  };
  const repository = new TransactionRepository({
    createQueryBuilder: () => query,
  } as never);
  repository.qb({
    userIds: ['u1'],
    ids: ['t1'],
    amounts: ['100'],
    type: TransactionType.DEPOSIT,
  });
  expect(query.andWhere).toHaveBeenCalledWith(
    'transaction.userId in (:...userIds)',
    { userIds: ['u1'] },
  );
  expect(query.andWhere).toHaveBeenCalledWith(
    'transaction.amount in (:...amounts)',
    { amounts: ['100'] },
  );
  expect(query.andWhere).toHaveBeenCalledWith('transaction.id in (:...ids)', {
    ids: ['t1'],
  });
});
