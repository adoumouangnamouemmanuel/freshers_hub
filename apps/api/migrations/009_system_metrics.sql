CREATE TABLE IF NOT EXISTS api_metrics (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  metric_hour INTEGER NOT NULL,
  status_code VARCHAR(10) NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (metric_date, metric_hour, status_code)
);

CREATE INDEX IF NOT EXISTS idx_api_metrics_date_hour ON api_metrics(metric_date, metric_hour);
