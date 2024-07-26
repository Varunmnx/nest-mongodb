export enum FileCategory {
  PROFILE_IMAGE = 'PROFILE_IMAGE',
  // IMAGE = 'IMAGE',
  // UNKNOWN = 'UNKNOWN'
  // AUDIO = 'AUDIO',
  // VIDEO = 'VIDEO',
}

export interface IFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  buffer: any;
  size: number;
}

export class S3UploadResult {
  private constructor(
    public readonly url: string,
    public readonly path: string,
    public readonly tag: string,
  ) {}

  public static of(url: string, path: string, tag: string): S3UploadResult {
    return new S3UploadResult(url, path, tag);
  }
}
