import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { kafkaOptionsFactory } from './config/kafka/kafka.config.js';
import { ensureKafkaTopics } from './config/kafka/kafka.bootstrap.js';
import { EventNameEnum } from './module/transaction/transaction.types.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prefix = config.get<string>('HTTP_PREFIX', '/api/transaction');
  const port = Number(config.get('HTTP_PORT', 9002));
  app.enableShutdownHooks();
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.connectMicroservice(kafkaOptionsFactory());
  const swagger = new DocumentBuilder()
    .setTitle('transaction microservice')
    .setDescription('API транзакций — глава 4')
    .addServer(`http://localhost:${port}${prefix}`)
    .build();
  SwaggerModule.setup(
    `${prefix}/docs`,
    app,
    SwaggerModule.createDocument(app, swagger),
  );
  await ensureKafkaTopics(Object.values(EventNameEnum));
  await app.startAllMicroservices();
  await app.listen(port);
}

void bootstrap();
