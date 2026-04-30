import type { Server as SocketIOServer } from 'socket.io';

let ioRef: SocketIOServer | null = null;

export function setSocketIo(io: SocketIOServer) {
  ioRef = io;
}

export function getSocketIo() {
  return ioRef;
}

