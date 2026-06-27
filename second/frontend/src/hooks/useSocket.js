import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(
      import.meta.env.VITE_API_URL || 'http://localhost:8000',
      {
        auth: { userId },
        withCredentials: true,
        transports: ['websocket']
      }
    );

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [userId]);

  return socket;
};

export default useSocket;
