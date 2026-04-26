import { useEffect, useRef, useState } from "react";

const WebSocketComponent = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      setStatus("Connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      setStatus("Disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    // if (socketRef.current?.readyState === WebSocket.OPEN) {
    //   socketRef.current.send(
    //     JSON.stringify({ type: "MESSAGE", message: "Hello from React" })
    //   );
    // }
  };

  return (
    <div>
      <h2>WebSocket Status: {status}</h2>
      
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  );
};

export default WebSocketComponent;

// <button onClick={sendMessage}>Send Message</button>