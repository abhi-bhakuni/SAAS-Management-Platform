import { OrganizationRole } from '../../../common/enums';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class InviteResponseDto {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  invitedBy?: UserResponseDto;
}
