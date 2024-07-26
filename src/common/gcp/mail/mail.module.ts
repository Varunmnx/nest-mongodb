import { Module, DynamicModule } from '@nestjs/common';
import { GoogleMailProvider } from './mail-provider';
import { ConfigService } from '@nestjs/config';
import { MicroserviceEnvVariables } from '@/microserviceFactory.factory';

@Module({})
export class GoogleMailModule {
  static forRoot(): DynamicModule {
    return {
      module: GoogleMailModule,
      providers: [
        {
          provide: GoogleMailProvider,
          useFactory: (configService: ConfigService) => {
            const envVars = new MicroserviceEnvVariables(configService);
            return new GoogleMailProvider({
              clientId: envVars.GOOGLE_CLIENT_ID,
              clientSecret: envVars.GOOGLE_CLIENT_SECRET,
              redirectUri: envVars.GOOGLE_REDIRECT_URI,
            });
          },
          inject: [ConfigService],
        },
      ],
      exports: [GoogleMailProvider],
      global: true,
    };
  }
}
