import { EntityRepository } from '@/database/entity.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConnectedAccountsDocument, ConnectedAccountsEntity, SocialMedia } from '../entities/connected-accounts.entity';
import { toObjectId } from '@/common/utils/utils';

@Injectable()
export class ConnectedAccountsRepository extends EntityRepository<ConnectedAccountsDocument> {
  // private repository: MongoRepository<RefreshTokenEntity>;
  constructor(@InjectModel(ConnectedAccountsEntity.name) connectedAccountEntity: Model<ConnectedAccountsDocument>) {
    // this.repository = this.dataSource.getMongoRepository(connectedAccountEntity);
    super(connectedAccountEntity);
  }

  async findByUserIdSocialMedia(
    userId: string | Types.ObjectId,
    socialMedia: SocialMedia,
  ): Promise<ConnectedAccountsEntity> {
    try {
      if (!userId || !socialMedia) {
        return null;
      }
      return await this.entityModel
        .findOne({
          user: toObjectId(userId),
          socialMedia,
        })
        .populate('user');
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<ConnectedAccountsEntity[]> {
    try {
      if (!userId) {
        return [];
      }
      return await this.entityModel
        .find({
          user: toObjectId(userId),
        })
        .populate('user');
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  async create(connectedAccountEntity: ConnectedAccountsEntity): Promise<ConnectedAccountsDocument | null> {
    try {
      if (!connectedAccountEntity) {
        return null;
      }
      const createdEntity = await this.entityModel.create(connectedAccountEntity);
      return createdEntity;
    } catch (error) {
      return null;
    }
  }

  async remove(
    id: Types.ObjectId | string | (Types.ObjectId | string)[],
  ): Promise<Types.ObjectId | string | (Types.ObjectId | string)[]> {
    try {
      if (!id) {
        return null;
      }

      if (Array.isArray(id)) {
        const ids = id.map((id) => toObjectId(id));
        const result = await this.entityModel.deleteMany({ _id: { $in: ids } });
        return result.deletedCount > 0 ? id : null;
      } else {
        const result = await this.entityModel.deleteOne({ _id: toObjectId(id) });
        return result.deletedCount > 0 ? id : null;
      }
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(
          `Error from ConnectedAccountsRepository.findById():${error.message}`,
          'ConnectedAccountsRepository',
        );
      } else {
        Logger.error(`Error from ConnectedAccountsRepository.findById():${error}`, 'ConnectedAccountsRepository');
      }
      return null;
    }
  }
}
