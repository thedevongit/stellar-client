import { Dialog, Notification } from "@mantine/core";
import { FC, useEffect } from "react";
import { IconAlertOctagonFilled, IconCheck, IconX } from "@tabler/icons-react";
import { setNotification } from "../../stores/common";
import { useDispatch, useSelector } from "react-redux";
import React from "react";

const Notifications: FC = () => {
  const dispatch = useDispatch();
  const { notification } = useSelector((state: any) => state.common);

  useEffect(() => {
    if (notification.isNotified) {
      const interval: any = setInterval(() => {
        dispatch(setNotification({
          isNotified: false,
          type: "",
          message: "",
        }));
      }, 10000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [notification.isNotified, dispatch]);

  if (!notification.isNotified) {
    return null;
  }

  return (
    <Dialog
      opened={notification.isNotified}
      size="lg"
      radius="md"
      onClose={() => dispatch(setNotification({
        isNotified: false,
        type: "",
        message: "",
      }))}
      transitionTimingFunction="ease-in-out"
    >
      {notification.type === "Error" ? (
        <Notification
          icon={<IconX size="1.1rem" />}
          color="red"
          title={notification.type}
          withCloseButton={false}
        >
          <p className="text-black">{notification.message}</p>
        </Notification>
      ) : notification.type === "Success" ? (
        <Notification
          icon={<IconCheck size="1.1rem" />}
          color="green"
          title={notification.type}
          withCloseButton={false}
        >
          <p className="text-black">{notification.message}</p>
        </Notification>
      ) : notification.type === "Info" ? (
        <Notification
          icon={<IconAlertOctagonFilled size="1.1rem" />}
          color="yellow"
          title={notification.type}
          withCloseButton={false}
        >
          <p className="text-black">{notification.message}</p>
        </Notification>
      ) : null}
    </Dialog>
  );
};

export default Notifications;
