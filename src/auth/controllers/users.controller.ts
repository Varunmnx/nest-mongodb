import { SentryInterceptor } from '@/common/interceptors/sentry.interceptor';
import { UseInterceptors, Controller, Get, Query, UseGuards, Put, Param, Patch, Body, Post } from '@nestjs/common';
import {  ApiBasicAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from '../users.service';
import { AuthGuard } from '@/common/guards/guards';
import { AuthInfo, BaseRequest } from '@/common/base.request';
import { AuthoriseUserResponse, FindUsersResponse, GetRoleRequest, UpdateUserRequest } from '../dto/create-user-request.dto';
import { UserRoles } from '@/common/enums/user-role.enums';
import { Roles } from '@/common/decorators/roles.decorator';
 

@UseInterceptors(SentryInterceptor)
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
 
  @Get()
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @ApiOkResponse({ description: 'Retrieve all users - only possible for admin', type: [FindUsersResponse] })
  @Roles(UserRoles.ADMIN)
  async findAll(@Query() req: BaseRequest): Promise<FindUsersResponse[]> {
    console.log(req.roles);
    return await this.userService.findAll(req);
  }

  @Get('/personal')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @ApiOkResponse({
    description: 'Retrieve personal data based on email- possible for admin and normal user',
    type: FindUsersResponse,
  })
  @Roles(UserRoles.USER, UserRoles.ADMIN) 
  async personalData(@Query() req: BaseRequest) {
    console.log(req.roles);
    return await this.userService.personalData(req);
  }

  @Get('/state')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @ApiOkResponse({ description: 'Get user state', type: AuthoriseUserResponse })
  getUserState(@Query() req: BaseRequest) {
    console.log(req.roles);
    return 'Ok';
  }

  @Put('/state')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @ApiOkResponse({ description: 'Update user state', type: AuthoriseUserResponse })
  //   @Roles(UserRoles.USER, UserRoles.ADMIN)
  // @Roles(UserRoles.ADMIN)
  updateUserState(@Query() req: BaseRequest) {
    console.log(req.roles);
    return 'Ok';
  }

  @Get('/role/:roleType')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @ApiOkResponse({ description: 'Get user role', type: AuthoriseUserResponse })
  findByRole(@Param() req: GetRoleRequest) {
    console.log(req.roles);
    return 'Ok';
  }

  @Patch('')
  @UseGuards(AuthGuard)
  @ApiBasicAuth(AuthInfo.JWT_AUTH_KEY)
  @ApiOkResponse({ description: 'Update user', type: FindUsersResponse }) 
  async updateUser(@Body() req: UpdateUserRequest): Promise<FindUsersResponse> {
    console.log(req.roles);
    return await this.userService.updateUserInfo(req);
  }

}
