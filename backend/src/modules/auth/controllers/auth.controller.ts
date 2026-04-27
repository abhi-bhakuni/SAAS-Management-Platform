import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import {
  LoginDto,
  SignupDto,
  AuthResponseDto,
  SwitchWorkspaceDto,
  SwitchWorkspaceResponseDto,
} from '../dtos/index';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, Public } from '../decorators/index';
import { AcceptInviteDto } from '../../organizations/dtos';
import { OrganizationInvitesService } from '../../organizations/services/organization-invites.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    @Inject(forwardRef(() => OrganizationInvitesService))
    private readonly invitesService: OrganizationInvitesService,
  ) {}

  /**
   * POST /auth/register - Register new user (PUBLIC)
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.register(signupDto);
  }

  /**
   * POST /auth/login - Login user (PUBLIC)
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * GET /auth/me - Get current user (PROTECTED)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    const fullUser = await this.usersService.findOne(user.id);
    const organization = user.selectedOrgId
      ? await this.organizationsService.findOne(user.selectedOrgId)
      : null;

    return {
      id: fullUser.id,
      email: fullUser.email,
      role: fullUser.role,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      name: organization?.name || null,
      selectedOrgId: user.selectedOrgId,
      orgRole: user.orgRole,
    };
  }

  /**
   * POST /auth/switch-workspace - Switch active workspace (PROTECTED)
   */
  @UseGuards(JwtAuthGuard)
  @Post('switch-workspace')
  @HttpCode(HttpStatus.OK)
  async switchWorkspace(
    @CurrentUser() user: any,
    @Body() switchDto: SwitchWorkspaceDto,
  ): Promise<SwitchWorkspaceResponseDto> {
    return this.authService.switchWorkspace(user.id, switchDto.organizationId);
  }

  /**
   * POST /auth/verify-email/:token - Verify email (PUBLIC)
   */
  @Public()
  @Post('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    // TODO: Implement email verification logic via UsersService
    return { message: 'Email verified successfully' };
  }

  /**
   * POST /auth/accept-invite - Accept organization invite (PUBLIC)
   */
  @Public()
  @Post('accept-invite')
  @HttpCode(HttpStatus.CREATED)
  async acceptInvite(@Body() acceptInviteDto: AcceptInviteDto): Promise<AuthResponseDto> {
    const inviteResult = await this.invitesService.acceptInvite(
      acceptInviteDto.token,
      acceptInviteDto,
    );

    return this.authService.createAuthResponseForOrg(
      inviteResult.user,
      inviteResult.invite.organizationId,
    );
  }
}
