import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { Roles, CurrentUser } from '../../auth/decorators/index';
import { OrganizationRole } from '../../../common/enums';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users - List all users (admin only)
   */
  @Roles(OrganizationRole.ADMIN)
  @Get()
  async findAll(): Promise<any> {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:id - Get single user
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.usersService.findOne(id);
  }

  /**
   * POST /users - Create user (admin only)
   */
  @Roles(OrganizationRole.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<any> {
    return this.usersService.create(createUserDto);
  }

  /**
   * PUT /users/:id - Update user (admin or self)
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    // Allow admin to update anyone, or user to update themselves
    if (user.role !== OrganizationRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * DELETE /users/:id - Delete user (admin only)
   */
  @Roles(OrganizationRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
