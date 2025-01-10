export interface CreateMagicLinkResponse {
  session_secret: string;
  id: string;
}
export interface ConsumeMagicLinkResponse {
  access_token: string;
  success: boolean;
}
export interface RefreshTokenResponse {
  access_token: string;
  success: boolean;
}
