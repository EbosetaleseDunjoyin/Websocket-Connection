import { useState, useRef, useCallback, useEffect } from "react";


// Utility function to check if notifications are supported
const isNotificationSupported = () => {
  return "Notification" in window;
};

// Utility function to request notification permission
const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log("This browser does not support desktop notification");
    return "unsupported";
  }

  try {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "error";
  }
};

// Custom hook for WebSocket and notification management
export const useWebSocketNotifications = ({
  websocketUrl = "ws://localhost:5000",
  notificationIcon = "",
  notificationBadge = "",
  onNotificationClick = () => {},
  reconnectInterval = 5000,
} = {}) => {
  const [count, setCount] = useState(0);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const ws = useRef(null);

  const showNotification = useCallback(
    async (title, message) => {
      try {
        if (!isNotificationSupported()) {
          alert("This browser does not support desktop notification");
          return;
        }

        switch (notificationPermission) {
          case "granted": {
            console.log("Log Notification start", message);
            const notification = new Notification(title, {
              body: message,
              icon: notificationIcon,
              badge: notificationBadge,
              timestamp: Date.now(),
              renotify: true,
              tag: "websocket-notification",
            });

            notification.onclick = () => {
              console.log("Notification clicked");
              window.focus();
              onNotificationClick();
            };

            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(
                JSON.stringify({
                  type: "acknowledgement",
                  title,
                  message,
                  timestamp: Date.now(),
                })
              );
            }
            break;
          }

          case "denied":
            console.log("Notifications blocked");
            break;

          default: {
            const permission = await requestNotificationPermission();
            setNotificationPermission(permission);
            if (permission === "granted") {
              showNotification(title, message);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error showing notification:", error);
      }
      console.log("Log Notification End", message);
    },
    [
      notificationPermission,
      notificationIcon,
      notificationBadge,
      onNotificationClick,
    ]
  );

  const connectWebSocket = useCallback(() => {
    try {
      ws.current = new WebSocket(websocketUrl);

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        setWsStatus("connected");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "notification") {
            showNotification(data.title, data.message);
            setCount((prev) => prev + 1);
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected");
        setWsStatus("disconnected");
        setTimeout(connectWebSocket, reconnectInterval);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setWsStatus("error");
      };
    } catch (error) {
      console.error("WebSocket Connection Error:", error);
      setWsStatus("error");
    }
  }, [websocketUrl, showNotification, reconnectInterval]);

  useEffect(() => {
    setNotificationPermission(Notification.permission);

    const initializeNotifications = async () => {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
    };

    initializeNotifications();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  return {
    count,
    notificationPermission,
    wsStatus,
    showNotification,
    websocket: ws.current,
  };
};

// Export utility functions
export { isNotificationSupported, requestNotificationPermission };
