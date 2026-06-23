import { io } from "socket.io-client";


const socket = io(
    "http://localhost:8000",
    {
        transports:["websocket"]
    }
);


socket.on(
    "connect",
    ()=>{

        console.log(
            "Client B connected:",
            socket.id
        );


        socket.emit(
            "join_video_room",
            {
                videoId:"6a39515cf0b3dc98056bd468"
            }
        );


        setTimeout(()=>{


            socket.emit(
                "typing_comment",
                {
                    videoId:"6a39515cf0b3dc98056bd468",

                    username:"Jaimin"
                }
            );


            console.log(
                "typing event sent"
            );


        },3000);

    }
);



socket.onAny(
    (event,data)=>{

        console.log(
            "B received:",
            event,
            data
        );

    }
);