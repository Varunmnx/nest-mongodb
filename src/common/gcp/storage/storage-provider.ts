import { MicroserviceEnvKeys } from '@/microserviceFactory.factory';
import { StorageOptions, AddAclOptions, File, Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GcpAction } from '../../enums/gcp-action.enum';

interface SignedUrlOptions {
  action: GcpAction;
  expires: number;
}

@Injectable()
export class StorageProvider {
  private storage: Storage;
  private bucketName: string;
  private urlValidTime: number;

  //  constructor({ gcpKeyFileName, gcpProjectId, gcpBucketName, gcpUrlValidTime }: StorageServiceOptions) {
  //   this.storage = new Storage({
  //     keyFilename: gcpKeyFileName,
  //     projectId: gcpProjectId,
  //   });

  //   this.bucketName = gcpBucketName;
  //   this.urlValidTime = Number(gcpUrlValidTime);
  // }
  constructor(
    options: StorageOptions,
    private readonly configService: ConfigService,
  ) {
    this.storage = new Storage(options);
    this.bucketName = configService.getOrThrow(MicroserviceEnvKeys.GOOGLE_CLOUD_BUCKET_NAME);
    this.urlValidTime = Number(configService.getOrThrow(MicroserviceEnvKeys.SIGNED_URL_LIFE_TIME_IN_SECONDS));
    // this.BUCKET_NAME=configService.get(MicroserviceEnvKeys.GCP_BUCKET_NAME)
    // this.SIGNED_URL_LIFE_TIME_IN_MINS = configService.get(MicroserviceEnvKeys.SIGNED_URL_LIFE_TIME_IN_MINS);
    // this.GCP_URL = configService.get(MicroserviceEnvKeys.GCP_URL);
  }

  public async uploadFile(fileBuffer: Buffer, folderName: string, fileName: string): Promise<void> {
    const filePath = `${folderName}/${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob: File = bucket.file(filePath);
    const blobStream = blob.createWriteStream();

    return new Promise<void>((resolve, reject) => {
      blobStream
        .on('finish', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });

      blobStream.end(fileBuffer);
    });
  }

  public async hasFile(folderName: string, fileName: string): Promise<boolean> {
    try {
      const filePath = folderName ? `${folderName}/${fileName}` : fileName;
      const file: File = this.storage.bucket(this.bucketName).file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  public async getFile(fileName: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob: File = bucket.file(fileName);

    return new Promise<Buffer>((resolve, reject) => {
      blob
        .download()
        .then((data) => {
          resolve(data[0]);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public async getBuffer(folderName: string, fileName: string): Promise<Buffer> {
    const filePath = folderName ? `${folderName}/${fileName}` : fileName;
    const hasFile = await this.hasFile(folderName, fileName);

    if (!hasFile) {
      return null;
    }
    return await this.getFile(filePath);
  }

  public async getBlob(folderName: string, fileName: string): Promise<Blob> {
    const filePath = folderName ? `${folderName}/${fileName}` : fileName;
    const hasFile = await this.hasFile(folderName, fileName);

    if (!hasFile) {
      return null;
    }
    const buffer = await this.getFile(filePath);
    return new Blob([buffer]);
  }

  public async generateFileUrl(folderName: string, fileName: string): Promise<string | null> {
    try {
      const filePath = folderName ? `${folderName}/${fileName}` : fileName;
      const hasFile = await this.hasFile(folderName, fileName);

      if (!hasFile) {
        return null;
      }

      const options: SignedUrlOptions = {
        action: GcpAction.READ,
        expires: Date.now() + this.urlValidTime,
      };

      const blob: File = this.storage.bucket(this.bucketName).file(filePath);
      const [signedUrl] = await blob.getSignedUrl(options);

      return signedUrl;
    } catch (error) {
      console.error('Error generating file URL:', error);
      return null;
    }
  }

  public async deleteFile(folderName: string, fileName: string): Promise<void> {
    const hasFile = await this.hasFile(folderName, fileName);

    if (!hasFile) {
      return;
    }

    const filePath = folderName ? `${folderName}/${fileName}` : fileName;
    const blob: File = this.storage.bucket(this.bucketName).file(filePath);

    return new Promise<void>(async (resolve, reject) => {
      try {
        await blob.delete();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  public async listFiles(): Promise<File[]> {
    const bucket = this.storage.bucket(this.bucketName);

    return new Promise<File[]>(async (resolve, reject) => {
      try {
        const [files] = await bucket.getFiles();
        resolve(files);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async copyFile(sourceFileName: string, destinationFileName: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const sourceFile: File = bucket.file(sourceFileName);
    const destinationFile: File = bucket.file(destinationFileName);

    return new Promise<void>(async (resolve, reject) => {
      try {
        await sourceFile.copy(destinationFile);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  public async moveFile(sourceFileName: string, destinationFileName: string): Promise<void> {
    await this.copyFile(sourceFileName, destinationFileName);
    await this.deleteFile('', sourceFileName);
  }

  public async setFileMetadata(fileName: string, metadata: Record<string, string>): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob: File = bucket.file(fileName);

    return new Promise<void>(async (resolve, reject) => {
      try {
        await blob.setMetadata(metadata);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  public async setFileAcl(fileName: string, acl: AddAclOptions): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob: File = bucket.file(fileName);

    return new Promise<void>(async (resolve, reject) => {
      try {
        await blob.acl.add(acl);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
