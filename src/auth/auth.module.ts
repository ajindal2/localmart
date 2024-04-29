import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module'; 
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshTokenSchema } from './schemas/refresh-token.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ThrottlerModule } from '@nestjs/throttler';


@Module({
  imports: [
    UserModule, 
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time to live in milliseconds (e.g., 1 minute)
        limit: 10, // Maximum number of requests within the TTL
      },
    ]),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST, // Your SMTP host
        port:  process.env.SMTP_PORT, // Your SMTP port
        secure: false, // true for 465, false for other ports
        auth: {
          user:  process.env.SMTP_USER, // SMTP username
          pass: process.env.SMTP_PASS, // SMTP password
        },
      },
      defaults: {
        from: process.env.SMTP_USER, // outgoing email ID
      },
      template: {
        dir: join(__dirname, '../../src/auth/templates'), 
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    MongooseModule.forFeature([{ name: 'RefreshToken', schema: RefreshTokenSchema }]),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
