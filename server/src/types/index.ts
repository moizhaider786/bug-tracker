export enum UserRoles {
  MANAGER = 'MANAGER',
  QA = 'QA',
  DEVELOPER = 'DEVELOPER',
}

export type JwtPayload = {
  id: number;
  role: UserRoles;
};

export enum BugStatus {
  NEW = 'NEW',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  RESOLVED = 'RESOLVED',
}

export enum BugType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
}

export enum NotificationTypes {
  CREATE_PROJECT = 'CREATE_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  CREATE_BUG = 'CREATE_BUG',
  UPDATE_BUG = 'UPDATE_BUG',
  DELETE_BUG = 'DELETE_BUG',
}
