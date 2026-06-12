# Alerting rules

Alerts that respect sleep: page only on user-facing, act-now conditions; everything else is a
warning to a dashboard/Slack. Thresholds from TRD §10.

| # | Alert | Condition | Severity | Action |
|---|---|---|---|---|
| 1 | Queue age high | oldest `queued` submission age > 60s (5m window) | **page** | Runbook §1 |
| 2 | Error rate | 5xx / total > 2% over 5m | **page** | Runbook §4 — roll back if deploy-correlated |
| 3 | Uptime probe | `/api/v1/health` non-200 twice in a row (1m interval) | **page** | Runbook §3 |
| 4 | Judge success rate | judged-AC-or-WA / submitted < 90% over 15m | warn | Runbook §2 (Judge0 health) |
| 5 | API latency | p95 non-judge API > 300ms over 10m | warn | check DB (pg_stat_statements), N+1s |
| 6 | DB connections | pool usage > 85% | warn | raise pool / find leak |
| 7 | Redis memory | used > 80% maxmemory | warn | check key growth, TTLs |
| 8 | LLM spend | daily spend > 80% of cap | warn | review; kill switch at 100% |
| 9 | Cert expiry | TLS cert < 14 days | warn | renew |

**Page** = wake the on-call (PagerDuty/Better Stack). **Warn** = Slack + dashboard, business hours.

Prometheus-style expressions (worker exposes `/metrics`):

```
# 1 — queue age
max(bullmq_queue_oldest_wait_seconds{queue="judge"}) > 60

# 2 — error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.02

# 5 — API latency p95
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route!~"/api/v1/submissions.*"}[10m])) by (le)) > 0.3
```

Dashboards (TRD §10): API latency, queue depth/age, judge success rate, error rate, LLM spend.
