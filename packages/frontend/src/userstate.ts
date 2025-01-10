import { createStore } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {} from "@redux-devtools/extension"; // required for devtools typing
import { RefreshTokenResponse } from "@kitchensync/common/loginmodel";
import { useQuery } from "@tanstack/react-query";
import { UserModel } from "@kitchensync/common/usermodel";

interface UserState {
  access_token: string | undefined;
  login: (access_token: string) => void;
  logout: () => void;
  claims: () => undefined | { email: string; exp: number };
  isExpired: () => boolean;
  refresh: () => Promise<void>;
  refreshIfExpired: () => Promise<void>;
}
export const userStore = createStore<UserState>()(
  devtools(
    persist(
      (set) => ({
        access_token: undefined,
        login(access_token) {
          set({ access_token });
        },
        logout() {
          set({ access_token: undefined });
          fetch("/api/auth/logout");
        },
        claims() {
          const claimsSection = this.access_token?.split(".")[1];
          if (!claimsSection) {
            return undefined;
          }
          return JSON.parse(atob(claimsSection));
        },
        isExpired() {
          const claims = this.claims();
          if (!claims) {
            return true;
          }
          const expiry = new Date(claims.exp * 1000);
          return new Date() > expiry;
        },
        async refresh() {
          try {
            const response = await fetch("/api/auth/refresh", {
              credentials: "same-origin",
            });
            const tokenResponse =
              (await response.json()) as RefreshTokenResponse;
            if (!tokenResponse.success) {
              console.error("failed to refresh token", tokenResponse);
              this.logout();
              return;
            }
            this.login(tokenResponse.access_token);
            return;
          } catch (e) {
            console.error("failed to refresh token", e);
            this.logout();
          }
        },
        async refreshIfExpired() {
          if (this.isExpired()) {
            await this.refresh();
          }
        },
      }),
      {
        name: "kitchensync-user",
      }
    )
  )
);

export async function makeAuthenticatedRequest<ResponseType>(
  path: string,
  fetchOptions?: RequestInit
): Promise<ResponseType | { success: false }> {
  const userState = userStore.getState();
  if (!userState.access_token) {
    return { success: false };
  }
  await userState.refreshIfExpired();
  const response = await fetch(path, {
    headers: { Authorization: userState.access_token },
    ...fetchOptions,
  });
  return await response.json();
}

export function useUserInfoQuery() {
  return useQuery({
    queryKey: ["self_info", userStore.getState().access_token],
    async queryFn() {
      const result = await makeAuthenticatedRequest<UserModel>(
        "/api/user/self"
      );
      if ("success" in result && result.success === false) {
        // probably this was invalid user state, so let's clear it
        userStore.getState().logout();
        throw new Error("failed to fetch user info");
      }
      return result as UserModel;
    },
  });
}
