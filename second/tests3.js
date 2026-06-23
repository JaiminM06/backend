import { io } from "socket.io-client";


const socket = io(
    "http://localhost:8000",
    {
        transports:["websocket"]
    }
);


socket.on("connect",()=>{

    console.log(
        "Client A connected:",
        socket.id
    );


    socket.emit(
        "join_video_room",
        {
            videoId:"6a39515cf0b3dc98056bd468"
        }
    );

});


socket.on(
    "viewer_count_update",
    (data)=>{

        console.log(
            "Viewer count:",
            data
        );

    }
);

socket.on(
    "new_comment",
    (data)=>{

        console.log(
            "🔥 New Comment Received:",
            data
        );

    }
);



socket.onAny((event,data)=>{

    console.log(
        "EVENT:",
        event,
        data
    );

});


socket.on(
    "user_typing",
    (data)=>{

        console.log(
            "⌨️ Someone typing:",
            data
        );

    }
);