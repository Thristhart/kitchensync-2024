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

interface CredentialsOptionsUser
  extends Omit<PublicKeyCredentialUserEntity, "id"> {
  id: string;
}
export interface RegisterCredentialsOptionsResponse
  extends Omit<PublicKeyCredentialCreationOptions, "challenge" | "user"> {
  challenge: string;
  user: CredentialsOptionsUser;
  challengeId: string;
}

export interface RequestCredentialsOptionsResponse
  extends Omit<PublicKeyCredentialRequestOptions, "challenge"> {
  challenge: string;
  challengeId: string;
}

export interface WebauthnLoginRequest {
  id: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | undefined;
  };
  challengeId: string;
}
export interface WebauthnLoginResponse {
  access_token: string;
  success: true;
}
