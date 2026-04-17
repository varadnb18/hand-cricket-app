import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_BACKEND_URL);

const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
