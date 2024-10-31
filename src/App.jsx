// src/App.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [wsStatus, setWsStatus] = useState('disconnected')
  const ws = useRef(null)

  
  const connectWebSocket = useCallback(() => {
    try {
      ws.current = new WebSocket('ws://localhost:5000');

      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        setWsStatus('connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            showNotification(data.title, data.message);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket Disconnected');
        setWsStatus('disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setWsStatus('error');
      };

    } catch (error) {
      console.error('WebSocket Connection Error:', error);
      setWsStatus('error');
    }
  }, []);

  // Initialize WebSocket and request notification permission
  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    // Set initial permission state
    setNotificationPermission(Notification.permission);

    const requestNotificationPermission = async () => {
      try {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    requestNotificationPermission();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);


  const showNotification = useCallback(async (title, message) => {
    
    try {
      if (!('Notification' in window)) {
        alert('This browser does not support desktop notification');
        return;
      }

      switch (notificationPermission) {
        case 'granted':
          console.log('Log Notification start',message);
          const notification = new Notification(title, {
            body: message,
            icon: reactLogo,
            badge: viteLogo,
            timestamp: Date.now(),
            renotify: true,
            tag: 'websocket-notification'
          });

          notification.onclick = () => {
            console.log('Notification clicked');
            window.focus();
          };

          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'acknowledgement',
              title,
              message,
              timestamp: Date.now()
            }));
          }
          break;

        case 'denied':
          console.log('Notifications blocked');
          break;

        default:
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          if (permission === 'granted') {
            showNotification(title, message);
          }
          break;
      }
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
    console.log('Log Notification End',message);
  }, [notificationPermission]);

  const handleCount = () => {
    setCount((prevCount) => prevCount + 1);
    showNotification('Counter Updated', `Count is now ${count + 1}`);
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <div className="status-indicators">
          <p>WebSocket Status: {wsStatus}</p>
          <p>Notification Permission: {notificationPermission}</p>
        </div>
        <button onClick={handleCount}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App