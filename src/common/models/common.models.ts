import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseRequest } from '../base.request';
import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { isTruthy, toNumber } from '../utils/utils';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type SortOrderType = 1 | -1;

export class ResponseOK {
  @ApiProperty({ type: String, description: 'Response OK', default: 'OK' })
  public readonly message: string;

  public constructor(message: string) {
    this.message = message || 'OK';
  }

  public static of(message?: string): ResponseOK {
    return new ResponseOK(message);
  }
}

export class Pagination extends BaseRequest {
  @ApiPropertyOptional({ type: Number, description: 'page', default: 0 })
  @IsOptional()
  @IsNumberString()
  public readonly page: number;
  @ApiPropertyOptional({ type: Number, description: 'limit', default: 10 })
  @IsOptional()
  @IsNumberString()
  public readonly limit: number;
  @ApiPropertyOptional({ enum: SortOrder, description: 'sortOrder', default: SortOrder.DESC })
  @IsOptional()
  @IsString()
  public readonly sortOrder: SortOrder;
  @ApiPropertyOptional({ type: String, description: 'sortByName' })
  @IsOptional()
  @IsString()
  public readonly sortByName: SortOrder;
}

export class UserIdQuery extends BaseRequest {
  @ApiProperty({ type: String, description: 'userId' })
  @ApiPropertyOptional()
  public readonly userId: string;
}

export class ListRequest<T> {
  public list: T[];
}

function _toObject(value: any) {
  try {
    if (typeof value == 'object') {
      return value;
    }

    return JSON.parse(value);
  } catch (error) {}

  return value;
}

export class KeyValuePair<K, V> {
  private constructor(
    public key: K,
    public value: V,
    public message?: string,
  ) {}

  public static of<K, V>(key: K, value: V, isMessageRequired: boolean = false) {
    if (isMessageRequired) {
      const msg: string = key.toString();
      return new KeyValuePair(key, value, msg);
    }
    return new KeyValuePair(key, value);
  }

  public static copyFrom<K, V>(value: any): KeyValuePair<K, V> {
    if (!value) return null;

    value = _toObject(value);

    if (typeof value != 'object') {
      return value;
    }

    return new KeyValuePair(value['key'], value['message'], value['value']);
  }
}

export class ListResponse<T> {
  public list: T[];

  public constructor(list?: T[]) {
    if (list != null) {
      this.list = list;
    } else {
      this.list = [];
    }
  }

  public static of<T>(list?: T[]): ListResponse<T> {
    return new ListResponse<T>(list);
  }

  public addOne(item: T): ListResponse<T> {
    if (!item) {
      return this;
    }

    this.list.push(item);
    return this;
  }

  public addAll(list: T[]): ListResponse<T> {
    if (!list || list.length == 0) {
      return this;
    }

    list.map((element) => this.list.push(element));

    return this;
  }
}

export class RepoPagination {
  public readonly page: number;
  public readonly limit: number;
  public readonly skip: number;
  public readonly sortOrder: SortOrderType;

  private constructor(page: number, skip: number, limit: number, sortOrder: SortOrderType) {
    this.page = Number(page);
    this.skip = Number(skip);
    this.limit = Number(limit);
    this.sortOrder = Number(sortOrder) as SortOrderType;
  }

  static of(pagination: Pagination) {
    const page = isTruthy(pagination.page) ? toNumber(pagination.page) : 1;
    const limit = isTruthy(pagination.limit) ? toNumber(pagination.limit) : 10;
    const skip_ = (page - 1) * limit;
    const sortOrder = pagination.sortOrder === SortOrder.ASC ? 1 : -1;

    return new RepoPagination(page, skip_, limit, sortOrder);
  }
}

export class PaginationResponse<T> {
  constructor(
    public page: number = 1,
    public limit: number,
    public total: number,
    public list: T[] = [],
  ) {}

  static builder<T>(): PaginationResponseBuilder<T> {
    return new PaginationResponseBuilder<T>();
  }

  toBuilder(): PaginationResponseBuilder<T> {
    return new PaginationResponseBuilder<T>()
      .setList(this.list)
      .setPage(this.page)
      .setLimit(this.limit)
      .setCount(this.total);
  }
}

export class PaginationResponseBuilder<T> {
  private page: number = 1;
  private limit: number;
  private total: number;
  private list: T[] = [];

  setPage(page: number): this {
    this.page = page;
    return this;
  }

  setLimit(limit: number): this {
    this.limit = limit;
    return this;
  }

  setCount(total: number): this {
    this.total = total;
    return this;
  }

  setList(list: T[]): this {
    this.list = list;
    return this;
  }

  build(): PaginationResponse<T> {
    return new PaginationResponse<T>(this.page, this.limit, this.total, this.list);
  }
}
