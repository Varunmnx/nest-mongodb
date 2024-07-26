import { Module, DynamicModule } from '@nestjs/common';
import { StorageProvider } from './storage-provider';
import { StorageOptions } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Module({})
export class StorageModule {
  static forRoot(options: StorageOptions): DynamicModule {
    const config = new ConfigService();
    const storageProvider = {
      provide: StorageProvider,
      useFactory: () => new StorageProvider(options, config),
    };
    return {
      module: StorageModule,
      providers: [storageProvider],
      exports: [storageProvider],
      global: true,
    };
  }
}
