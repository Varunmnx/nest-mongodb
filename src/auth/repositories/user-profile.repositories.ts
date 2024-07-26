import { Injectable, Logger } from '@nestjs/common';
import { UserProfileDocument, UserProfileEntity } from '../entities/user-profile.entity';
import { EntityRepository } from '@/database/entity.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserProfileRepository extends EntityRepository<UserProfileDocument> {
  // private repository: MongoRepository<UserProfileEntity>;
  // constructor(private dataSource: DataSource) {
  //   this.repository = this.dataSource.getMongoRepository(UserProfileEntity);
  // }
  constructor(@InjectModel(UserProfileEntity.name) userProfileEntity: Model<UserProfileDocument>) {
    super(userProfileEntity);
  }

  async create(user: UserProfileEntity): Promise<UserProfileDocument | null> {
    try {
      if (!user) {
        return null;
      }

      const createdEntity = await this.entityModel.create(user);

      return createdEntity;
    } catch (error) {
      console.error(`Error from RefreshTokenService.create(): ${error}`);
      return null;
    }
  }
  async findAll(): Promise<UserProfileDocument[]> {
    try {
      return await this.entityModel.find();
    } catch (error) {
      return [];
    }
  }

  async findById(id: string): Promise<UserProfileDocument> {
    try {
      if (!id) {
        return null;
      }

      return await this.entityModel.findById(id);
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error from userRepo.findById():${error.message}`, 'USER-REPOSITORY');
      } else {
        Logger.error(`Error from userRepo.findById():${error}`, 'USER-REPOSITORY');
      }
      return null;
    }
  }
}
