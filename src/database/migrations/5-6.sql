CREATE INDEX tickets_closed_idx ON tickets (closed);
CREATE INDEX tickets_panel_closed_idx ON tickets (panelId, closed);
CREATE INDEX tickets_panel_owner_closed_idx ON tickets (panelId, owner, closed);
CREATE INDEX tickets_thread_id_idx ON tickets (threadId);
CREATE INDEX close_requests_ticket_id_idx ON closeRequests (ticketId);
CREATE INDEX close_requests_auto_close_idx ON closeRequests (autoClose) WHERE autoClose IS NOT NULL;
