import { Module, DynamicModule } from '@nestjs/common';
import { GoogleCalendarProvider } from './calendar-provider';
import { ConfigService } from '@nestjs/config';
import { MicroserviceEnvVariables } from '@/microserviceFactory.factory';

@Module({})
export class GoogleCalendarModule {
  static forRoot(): DynamicModule {
    return {
      module: GoogleCalendarModule,
      providers: [
        {
          provide: GoogleCalendarProvider,
          useFactory: (configService: ConfigService) => {
            const envVars = new MicroserviceEnvVariables(configService);
            return new GoogleCalendarProvider({
              clientId: envVars.GOOGLE_CLIENT_ID,
              clientSecret: envVars.GOOGLE_CLIENT_SECRET,
              redirectUri: envVars.GOOGLE_REDIRECT_URI,
            });
          },
          inject: [ConfigService],
        },
      ],
      exports: [GoogleCalendarProvider],
      global: true,
    };
  }
}
