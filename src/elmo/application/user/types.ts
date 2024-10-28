export const POWER_USER_ROLE = 'powerUser'; // 系統管理員
export const SUPERVISOR_ROLE = 'supervisor'; // 區處管理員

export const ROLE_TYPES = [POWER_USER_ROLE, SUPERVISOR_ROLE] as const;

export type RoleType = (typeof ROLE_TYPES)[number];
