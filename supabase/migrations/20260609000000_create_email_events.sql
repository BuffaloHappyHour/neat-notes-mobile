CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient TEXT,
  clicked_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX email_events_resend_email_id_idx ON email_events(resend_email_id);
CREATE INDEX email_events_event_type_idx ON email_events(event_type);
CREATE INDEX email_events_created_at_idx ON email_events(created_at);
