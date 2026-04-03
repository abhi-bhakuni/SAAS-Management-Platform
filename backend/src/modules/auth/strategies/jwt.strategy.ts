import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, OrganizationRole } from '../../../common/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  selectedOrgId: string; // Currently active workspace
  orgRole: OrganizationRole; // Role within selectedOrgId
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    if (!payload.sub || !payload.email || !payload.role || !payload.selectedOrgId || !payload.orgRole) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      selectedOrgId: payload.selectedOrgId, // Currently active workspace
      orgRole: payload.orgRole, // Role within selectedOrgId
    };
  }
}
