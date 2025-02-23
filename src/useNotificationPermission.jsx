import { useEffect } from "react";

const useNotificationPermission = () => {
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (!("Notification" in window)) {
        console.log("Tarayıcı bildirimleri desteklemiyor.");
        return;
      }

      if (Notification.permission === "granted") {
        console.log("Bildirim izni zaten verilmiş.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Bildirim izni verildi.");
      } else {
        console.log("Bildirim izni reddedildi.");
      }
    };

    requestNotificationPermission();
  }, []);
};

export default useNotificationPermission;
