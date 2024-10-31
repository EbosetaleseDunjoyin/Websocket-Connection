// websocket.js
import { useState, useEffect, useRef, useCallback } from "react";

export const useWebSocket = (url, icon, badge = '') => {
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission
  );
  const ws = useRef(null);

  // Request notification permission if needed
  const requestNotificationPermission = useCallback(async () => {
    if (Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Function to show the notification
  const showNotification = useCallback(
    (title, message) => {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
      }

      if (notificationPermission === "granted") {
        const notification = new Notification(title, {
          body: message,
          icon: icon,
          badge: badge,
          timestamp: Date.now(),
          renotify: true,
          tag: "websocket-notification",
        });

        notification.onclick = () => {
          window.focus();
        };
      } else if (notificationPermission === "denied") {
        console.log("Notifications are blocked");
      }
    },
    [notificationPermission, icon, badge]
  );

  // WebSocket connection logic
  const connectWebSocket = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        setWsStatus("connected");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            showNotification(data.title, data.message);
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected");
        setWsStatus("disconnected");
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setWsStatus("error");
      };
    } catch (error) {
      console.error("WebSocket Connection Error:", error);
      setWsStatus("error");
    }
  }, [url, showNotification]);

  // Initialize WebSocket and request notification permission
  useEffect(() => {
    requestNotificationPermission();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket, requestNotificationPermission]);

  // Function to send a message via WebSocket
  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  }, []);

  return { wsStatus, sendMessage };
};
