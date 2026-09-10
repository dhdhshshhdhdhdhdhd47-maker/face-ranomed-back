/**
 * Socket.IO orqali real-time turniket monitoringi
 */

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('[WS] Yangi ulanish:', socket.id);

    socket.on('join_monitor', () => {
      socket.join('live_monitor');
      console.log('[WS] Live monitor kanaliga qo\'shildi:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Ulanish uzildi:', socket.id);
    });
  });

  return io;
}

module.exports = setupWebSocket;
