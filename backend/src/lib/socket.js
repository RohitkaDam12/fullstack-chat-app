import { Server } from "socket.io";
import http from "http";
import express from "express";


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],  
  },
});


export function getReciverSocketId(userId){
  return userSocketsMap[userId] || null;
} 

//used to store online users
const userSocketsMap = {};

io.on("connection", (socket)  => {
  console.log("A user connected", socket.id);

  const userId =  socket.handshake.query.userId;
  if(userId) {
    userSocketsMap[userId] = socket.id;
  };

  io.emit("getOnlineUsers", Object.keys(userSocketsMap)); // Emit online users to all clients


  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketsMap[userId]; // Remove user from online users list
    io.emit("getOnlineUsers", Object.keys(userSocketsMap)); // Emit updated online users to all clients
  });  
});

export {io, server, app};