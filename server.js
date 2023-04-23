const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

let clientNo = 0;
var rooms = [];
io.on('connection', (socket) => {
    console.log('A user connected to the server....');
    var mineX;
    var mineY;
    var isOnline = false;
    var id;
    socket.on('start', function(){
        mineX = Math.floor(Math.random()*900);
        mineY = Math.floor(Math.random()*600);
        setTimeout(()=>{
          socket.emit('gameStart', {
            "gameStatus": "Start"
          });
        }, 1000);
    });
    socket.on('alert', function(data){
        var alert = false;
        if(Math.sqrt(Math.pow(mineX-data.X, 2) + Math.pow(mineY-(data.Y), 2)) <= 250){
            alert = true;
        }
        if(alert){
            socket.emit('success', {X: mineX, Y: mineY});
            mineX = Math.floor(Math.random()*900);
            mineY = Math.floor(Math.random()*600);
        }
        else{
            socket.emit('fail');
        }
    });
    socket.on('playOnline',()=>{
      clientNo++;
      isOnline = true;
      id = clientNo;
      socket.join(Math.round(clientNo/2));
      if(Math.round(clientNo/2)*2 == clientNo){
        socket.emit('onQueue',clientNo);
        rooms.push({roomNo:Math.round(clientNo/2), user1:{status:false, mineX: 0, mineY:0, moveX:0, moveY:0}, user2:{status:false, mineX:0, mineY:0, moveX:0, moveY:0}, status:false});
        io.to(Math.round(clientNo/2)).emit('startOnline');
      }
      else
        socket.emit('onQueue',clientNo);
    });
    socket.on('roundChange',(playerStatus)=>{
      const room = rooms[playerStatus.roomNo-1];
      let user;
      let opponent;
      console.log('roundChange');
      if(playerStatus.id == playerStatus.roomNo*2)
      {
        if (typeof room.user2 == 'undefined')
          room.user2 = {isOnline:false}
        room.user2 = playerStatus;
        user = room.user2;
        opponent = room.user1;
      }
      else{
        room.user1 = playerStatus;
        user = room.user1;
        opponent = room.user2;
      }
      if(room.status)
      {
        if(Math.sqrt(Math.pow(user.moveX-opponent.mineX, 2) + Math.pow(user.moveY-opponent.mineY, 2)) <= 250){
          console.log('Collisionnn');
          user.finded = true;
          console.log(user.id);
          user.score++;
        } 
      }
      if((room.user1.move == room.user2.move) && (room.user1.move != room.status)){//Change status of round
        room.status = !room.status;
      }
      io.to(room.roomNo).emit('round',room);
    });
    socket.on('disconnect', () => {
      if(isOnline){
        clientNo--;
        io.to(Math.round((id-1)/2)).emit('round',{abondon:true});
        rooms.splice(Math.round((id-1)/2),1);
      }
      console.log('user disconnected');
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});