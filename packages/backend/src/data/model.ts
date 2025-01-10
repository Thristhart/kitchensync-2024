/*
* This file was generated by a tool.
* Rerun sql-ts to regenerate this file.
*/
export interface LobbyDBO {
  'display_name': string | null;
  'id': string;
}
export interface LobbyUserDBO {
  'flags': number | null;
  'lobby_id': number | null;
  'user_id': number | null;
}
export interface MagicLinkDBO {
  'email': string;
  'id': string;
  'secret_hash': string;
  'session_ip': string;
  'session_secret_hash': string;
  'session_ua': string;
  'timestamp': number;
  'validated': number | null;
}
export interface MediaObjectDBO {
  'duration_ms': number | null;
  'faucet_data': string;
  'id': number;
  'image_url': string | null;
  'lobby_id': number | null;
  'title': string | null;
}
export interface PublicKeyCredentialDBO {
  'counter': number | null;
  'external_id': string | null;
  'public_key': string | null;
  'user_id': number | null;
}
export interface SchemaMigrationDBO {
  'version': string | null;
}
export interface TokenDBO {
  'refresh_token_id': string;
  'refresh_token_secret_hash': string;
  'session_ip': string;
  'session_ua': string;
  'timestamp': number;
  'user_id': number;
}
export interface UserDBO {
  'display_name': string | null;
  'email': string;
  'id': number;
}

/*
* This file was generated by a tool.
* Rerun sql-ts to regenerate this file.
*/
export interface WriteLobbyDBO {
  'display_name'?: string | null;
  'id'?: string;
}
export interface WriteLobbyUserDBO {
  'flags'?: number | null;
  'lobby_id'?: number | null;
  'user_id'?: number | null;
}
export interface WriteMagicLinkDBO {
  'email': string;
  'id'?: string;
  'secret_hash': string;
  'session_ip': string;
  'session_secret_hash': string;
  'session_ua': string;
  'timestamp': number;
  'validated'?: number | null;
}
export interface WriteMediaObjectDBO {
  'duration_ms'?: number | null;
  'faucet_data': string;
  'id'?: number;
  'image_url'?: string | null;
  'lobby_id'?: number | null;
  'title'?: string | null;
}
export interface WritePublicKeyCredentialDBO {
  'counter'?: number | null;
  'external_id'?: string | null;
  'public_key'?: string | null;
  'user_id'?: number | null;
}
export interface WriteSchemaMigrationDBO {
  'version'?: string | null;
}
export interface WriteTokenDBO {
  'refresh_token_id'?: string;
  'refresh_token_secret_hash': string;
  'session_ip': string;
  'session_ua': string;
  'timestamp': number;
  'user_id': number;
}
export interface WriteUserDBO {
  'display_name'?: string | null;
  'email': string;
  'id'?: number;
}
