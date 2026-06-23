import { io } from "socket.io-client";


const CREATOR_ID = "68e69d109f75ca1f448841a7";


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
            "Creator connected:",
            socket.id
        );


        socket.emit(
            "register",
            CREATOR_ID
        );


        console.log(
            "Creator registered"
        );

    }
);



socket.on(
    "notification",
    (data)=>{

        console.log(
            "🔔 Notification received:"
        );

        console.log(data);

    }
);



socket.onAny(
    (event,data)=>{

        console.log(
            "EVENT:",
            event,
            data
        );

    }
);