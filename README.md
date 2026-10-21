# Transaction — ОНИ

Сервис транзакций PostgreSQL + Kafka. Операции: `DEPOSIT`, `WITHDRAWL`, `TRANSFER`.

## Проверка

Node.js 24:

```sh
npm ci
npm run lint
npm test
npm run build
```

Workflow `.github/workflows/ci.yml` выполняет эти проверки и собирает Docker-образ.
Запуски: https://github.com/markld-ui/transaction-itegration/actions.

## Запуск всего приложения

Репозитории должны лежать рядом в каталогах `account`, `auth`, `transaction`.
Из общего каталога:

```sh
docker compose -f account/docker/docker-compose.yml up -d --build --wait --wait-timeout 240
node account/scripts/smoke.mjs
```

Swagger: http://localhost:9002/api/transaction/docs.
Настройки для Compose заданы в нём, отдельный `.env` не нужен.
Для запуска на хосте используйте `.env.example`, запущенные PostgreSQL/Kafka
и `npm run start:dev`; не занимайте одновременно порт контейнерного сервиса.

Подробности по всем лабораторным, ручным запросам и Kubernetes:
[Account RUNBOOK](https://github.com/markld-ui/account-itegration/blob/main/RUNBOOK.md).
