import { useStore } from "zustand";
import { userStore, useUserInfoQuery } from "./userstate";
import {
  LogoutButton,
  MagicLinkLogin as LoginPrompt,
  PasskeyRegistration,
} from "./login";

export function UserInfo() {
  const user = useStore(userStore);
  const userInfoQuery = useUserInfoQuery();
  if (!user.access_token) {
    return <LoginPrompt />;
  }
  return (
    <span>
      Signed in as{" "}
      {userInfoQuery.data?.display_name ?? userInfoQuery.data?.email}
      <PasskeyRegistration />
      <LogoutButton />
    </span>
  );
}
