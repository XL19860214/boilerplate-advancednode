/*global io*/
let socket = io();

socket.on('user count', data => {
  console.log(data);
});

socket.on('user', data => {
  $('#num-users').text(data.currentUsers + ' users online');
  let message =
    data.name +
    (data.connected ? ' has joined the chat.' : ' has left the chat.');
  $('#messages').append($('<li>').html('<b>' + message + '</b>'));
});

$('form').submit(event => {
  event.preventDefault();
  const messageToSend = {
    message: $('#m')[0].value
  }
  socket.emit('chat message', messageToSend);
  $('#m')[0].value = '';
});

socket.on('chat message', data => {
  const message = data.name + ": " + data.message;
  $('#messages').append($('<li>').html('<b>' + message + '</b>'));
})
