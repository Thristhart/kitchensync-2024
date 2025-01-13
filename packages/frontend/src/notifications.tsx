import { createStore, useStore } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { getCurrentUserId } from "./userstate";
import { PasskeyRegistration } from "./login";
import "./notifications.css";

export enum NotificationType {
  PasskeyNag,
  Error,
  Success,
}

interface Notification {
  timestamp: number;
  duration?: number;
  id: number;
  data?: unknown;
  type: NotificationType;
}
interface NotificationsState {
  byUserId: {
    [userId: number]: {
      notifications: Array<Notification>;
    };
  };
  nextId: number;
  notify: (
    notification: Omit<Notification, "id" | "timestamp"> &
      Partial<Pick<Notification, "timestamp">>
  ) => void;
  deleteNotification: (notificationToDelete: Notification) => void;
  getNotifications: () => Array<Notification>;
  clearExpiredNotifications: () => void;
}
export const notificationsState = createStore<NotificationsState>()(
  devtools(
    persist(
      immer((set) => ({
        byUserId: {},
        nextId: 0,
        notify(notification) {
          const currentUser = getCurrentUserId() ?? -1;
          set((state) => {
            state.byUserId[currentUser] ??= {
              notifications: [],
            };
            state.byUserId[currentUser].notifications.push({
              timestamp: Date.now(),
              ...notification,
              id: state.nextId++,
            });
          });
        },
        deleteNotification(notificationToDelete) {
          const currentUser = getCurrentUserId() ?? -1;
          set((state) => {
            state.byUserId[currentUser].notifications =
              state.byUserId[currentUser].notifications?.filter(
                (notification) => notification.id !== notificationToDelete.id
              ) ?? [];
          });
        },
        getNotifications() {
          const currentUser = getCurrentUserId() ?? -1;
          return this.byUserId[currentUser]?.notifications ?? [];
        },
        clearExpiredNotifications() {
          set((state) => {
            for (const userId in state.byUserId) {
              state.byUserId[userId].notifications ??= [];
              state.byUserId[userId].notifications = state.byUserId[
                userId
              ].notifications.filter((notification) => {
                if (!notification.duration) {
                  return true;
                }
                return (
                  Date.now() - notification.timestamp < notification.duration
                );
              });
            }
          });
        },
      })),
      {
        name: "kitchensync-notifications",
      }
    )
  )
);

export function notify(
  notification: Omit<Notification, "id" | "timestamp"> &
    Partial<Pick<Notification, "timestamp">>
) {
  notificationsState.getState().notify(notification);
}

setInterval(() => {
  notificationsState.getState().clearExpiredNotifications();
}, 1000);

export function Notifications() {
  const notificationStore = useStore(notificationsState);
  const notifications = notificationStore.getNotifications();

  if (notifications.length === 0) {
    return null;
  }
  return (
    <div className="notifications">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          dismiss={() => notificationStore.deleteNotification(notification)}
        />
      ))}
    </div>
  );
}

interface NotificationProps {
  notification: Notification;
  dismiss: () => void;
}
function Notification(props: NotificationProps) {
  const RenderComponent = getNotificationRenderer(props.notification);
  return <RenderComponent {...props} />;
}

function getNotificationRenderer(
  notification: Notification
): React.ComponentType<NotificationProps> {
  switch (notification.type) {
    case NotificationType.PasskeyNag:
      return PasskeyNagNotification;
    case NotificationType.Error:
      return ErrorNotification;
    case NotificationType.Success:
      return SuccessNotification;
  }
}

function PasskeyNagNotification(props: NotificationProps) {
  return (
    <span className="notification passkeynag">
      <PasskeyRegistration onClick={props.dismiss}>
        To make future logins easier, click here to create a Passkey!
      </PasskeyRegistration>
      <button onClick={props.dismiss}>x</button>
    </span>
  );
}

function ErrorNotification(props: NotificationProps) {
  const errorMessage = props.notification.data as string;
  return (
    <span className="notification errorNotification">
      {errorMessage}
      <button onClick={props.dismiss}>x</button>
    </span>
  );
}

function SuccessNotification(props: NotificationProps) {
  const successMessage = props.notification.data as string;
  return (
    <span className="notification successNotification">
      {successMessage}
      <button onClick={props.dismiss}>x</button>
    </span>
  );
}
