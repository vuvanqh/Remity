import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { db } from './database/kysely.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await db
  .selectFrom('stocks')
  .selectAll()
  .execute()

  console.log('Database connected')

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
