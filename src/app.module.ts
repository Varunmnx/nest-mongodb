import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerService } from './common/logger/logger.service';
import { AuthModule } from './auth/auth.module';
//env dependancy
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ENV } from './env';
// mongoose dependancy
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose/dist/interfaces/mongoose-options.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { MicroserviceEnvVariables } from './microserviceFactory.factory';

/***
 * App Module for NestJS
 */
@Module({
  imports: [    
  ConfigModule.forRoot({ isGlobal: true, envFilePath: ENV.envFileName()}),
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService): Promise<MongooseModuleFactoryOptions> => ({
      uri: new MicroserviceEnvVariables(configService).MONGODB_DB_URL,
    }),
    inject: [ConfigService],
  }),
  AuthModule
],
  controllers: [AppController],
  providers: [    
    LoggerService,
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },],
})
export class AppModule {}
