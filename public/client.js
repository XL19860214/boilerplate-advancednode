/*global io*/
let socket = io();

socket.on('user count', function(data) {
  console.log(data);
});
