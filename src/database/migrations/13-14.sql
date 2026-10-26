ALTER TABLE panels ADD COLUMN pingSupportRoleOnOpen INT DEFAULT 1;
ALTER TABLE panels DROP COLUMN supportRole;
