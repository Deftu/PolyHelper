CREATE TABLE closeRequests (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  messageId TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'No reason provided',
  closer TEXT NOT NULL,
  autoClose INT
);
