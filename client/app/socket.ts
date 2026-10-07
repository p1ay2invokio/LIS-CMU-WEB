import { io } from 'socket.io-client'

export const socket = io("https://api.liscmu.online:3001", {
    autoConnect: false,
})