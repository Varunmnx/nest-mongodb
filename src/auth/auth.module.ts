import { Module } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { AuthService } from './services/auth.service';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repositories';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserProfileRepository } from './repositories/user-profile.repositories';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserController } from './controllers/users.controller';
import { UserService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthServiceSchemas } from './entities/schemas.register'; 
import { PassportModule } from '@nestjs/passport';
import { TwitterStrategy } from './strategies/twitter.strategy';
import { ConnectedAccountsRepository } from './repositories/connected-accounts.repository';  

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        signOptions: {
          algorithm: 'HS512',
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ session: true }),
    MongooseModule.forFeature([...AuthServiceSchemas]),
  ],
  controllers: [AuthController, UserController],

  providers: [
    AuthService,
    LoggerService,
    UserRepository,  
    UserProfileRepository,
    RefreshTokenRepository, 
    UserService,
    TwitterStrategy,
    ConnectedAccountsRepository,
  ],
  exports: [AuthService, UserService],
})
export class AuthModule {}
