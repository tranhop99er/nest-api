export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export interface UserCurrent extends UserPayload {
  username: string;
}
