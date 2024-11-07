import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../../../application/user/types';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);
