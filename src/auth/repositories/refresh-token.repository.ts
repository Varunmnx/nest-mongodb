import { Injectable } from '@nestjs/common';

import { RefreshTokenDocument, RefreshTokenEntity } from '../entities/refresh-token.entity';
import { EntityRepository } from '@/database/entity.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectId } from '@/common/utils/utils';

@Injectable()
export class RefreshTokenRepository extends EntityRepository<RefreshTokenDocument> {
  // private repository: MongoRepository<RefreshTokenEntity>;
  constructor(@InjectModel(RefreshTokenEntity.name) refreshTokenEntity: Model<RefreshTokenDocument>) {
    // this.repository = this.dataSource.getMongoRepository(RefreshTokenEntity);
    super(refreshTokenEntity);
  }

  async create(refreshTokenEntity: RefreshTokenEntity): Promise<RefreshTokenDocument | null> {
    try {
      if (!refreshTokenEntity) {
        return null;
      }

      const createdEntity = await this.entityModel.create(refreshTokenEntity);

      return createdEntity;
    } catch (error) {
      console.error(`Error from RefreshTokenService.create(): ${error}`);
      return null;
    }
  }
  async findById(id: string | Types.ObjectId): Promise<RefreshTokenEntity> {
    try {
      if (!id) {
        return null;
      }
      return await this.entityModel.findById(toObjectId(id));
    } catch (error) {
      return null;
    }
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<RefreshTokenEntity[]> {
    try {
      if (!userId) {
        return [];
      }
      return await this.entityModel
        .find({
          _user: toObjectId(userId),
        })
        .populate('users');
    } catch (error) {
      return [];
    }
  }

  async findByTokenAndSessionId(token: string, sessionId: string): Promise<RefreshTokenEntity> {
    try {
      if (!sessionId || !token) {
        return null;
      }

      return await this.entityModel
        .findOne({
          token: token,
          sessionId: sessionId,
        })
        .populate('user')
        .exec();
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async remove(
    refreshTokenEntity: RefreshTokenEntity | RefreshTokenEntity[],
  ): Promise<RefreshTokenEntity | RefreshTokenEntity[]> {
    if (!refreshTokenEntity) {
      return null;
    }
    try {
      if (Array.isArray(refreshTokenEntity)) {
        // If it's an array, remove all entities in the array
        // const result = await this.entityModel.deleteMany({ _id: { $in: refreshTokenEntity.map((item) => item._id) } });
        // return result.deletedCount > 0 ? refreshTokenEntity : null;
      } else {
        // If it's a single object, remove that object
        const result = await this.entityModel.deleteOne({ _id: toObjectId(refreshTokenEntity._id) });
        return result.deletedCount > 0 ? refreshTokenEntity : null;
      }
    } catch (error) {
      console.log('Error: ' + error);
      return null;
    }
  }
}
