import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
//import { CorrelationIdMiddleware } from './correlation-id.middleware';


async function bootstrap() {
  const environment = process.env.NODE_ENV || 'development';
  const envFilePath = `.env.${environment}`;
  dotenv.config({ path: envFilePath });

  // dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  //app.use('/uploads', express.static('uploads'));
  //app.useGlobalFilters(new NotFoundExceptionFilter()); // Apply globally
  //app.use(new CorrelationIdMiddleware().use);
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
