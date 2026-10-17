CREATE TABLE panels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  channel TEXT NOT NULL,
  buttonLabel TEXT NOT NULL,
  buttonEmoji TEXT,
  openingMessage TEXT NOT NULL,
  pingSupportRoleOnOpen INT NOT NULL,
  enabled INT NOT NULL
);
