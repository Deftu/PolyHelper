ALTER TABLE panels ADD COLUMN defaultTicketName TEXT NOT NULL DEFAULT '[{cleanPanelName}] ticket-{username}';
