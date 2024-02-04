export interface AdminToken {
  id: string;
  userId: string;
  tokenBcrypt: string;
  // token is only returned on the initial creation
  token?: string;

  disabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
}
