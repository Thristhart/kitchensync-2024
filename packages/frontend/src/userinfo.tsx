import { useStore } from "zustand";
import { userStore, useUserInfoQuery } from "./userstate";
import { LogoutButton, MagicLinkLogin } from "./login";

export function UserInfo() {
  const user = useStore(userStore);
  const userInfoQuery = useUserInfoQuery();
  if (!user.access_token) {
    return <MagicLinkLogin />;
  }
  return (
    <span>
      Signed in as{" "}
      {userInfoQuery.data?.display_name ?? userInfoQuery.data?.email}
      <LogoutButton />
    </span>
  );
}
