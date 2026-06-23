import {io} from "socket.io-client";


const socket=io(
"http://localhost:8000",
{
transports:["websocket"]
}
);


socket.on(
"connect",
()=>{


console.log(
"Connected to server 8000:",
socket.id
);


socket.emit(
"join_video_room",
{
videoId:"6a390a168ab517cf69aba6e8"
}
);


}
);



socket.on(
"new_comment",
(data)=>{


console.log(
"COMMENT RECEIVED ON 8000 CLIENT",
data
);


}
);