// import { useState, useEffect, useCallback, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useWebSocket } from './websocket';

function Home() {
   const { wsStatus, sendMessage } = useWebSocket('ws://localhost:5000', reactLogo, viteLogo);

  return (
    <>
      <div>
        <h1>WebSocket Status: {wsStatus}</h1>
        <button onClick={() => sendMessage(JSON.stringify({ type: 'message', text: 'Hello WebSocket!' }))}>
          Send WebSocket Message
        </button>
      </div>
    </>
  );

}
export default Home;

