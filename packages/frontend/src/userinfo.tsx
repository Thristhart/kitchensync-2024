import { useStore } from "zustand";
import { userStore, useUserInfoQuery } from "./userstate";
import {
  LogoutButton,
  MagicLinkLogin as LoginPrompt,
  PasskeyRegistration,
} from "./login";
import { Popover } from "./components/popover";
import "./userinfo.css";

export function UserInfo() {
  const user = useStore(userStore);
  const userInfoQuery = useUserInfoQuery();
  if (!user.access_token) {
    return (
      <Popover
        className="userInfoButton"
        popoverContent={<LoginPrompt />}
        popoverClassName="userInfoPopover"
      >
        login
      </Popover>
    );
  }
  if (!userInfoQuery.data) {
    return null;
  }
  return (
    <Popover
      className="userInfoButton"
      popoverContent={<UserSettings />}
      popoverClassName="userInfoPopover"
    >
      {userInfoQuery.data?.display_name ?? userInfoQuery.data?.email}
    </Popover>
  );
}

function UserSettings() {
  return (
    <>
      <PasskeyRegistration />
      <LogoutButton />
    </>
  );
}
