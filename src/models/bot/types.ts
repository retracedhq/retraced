export interface CreateBotRequest {
  name: string;
  disabled: boolean;
  projects: string[];
}

export interface BotAccount extends CreateBotRequest {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}