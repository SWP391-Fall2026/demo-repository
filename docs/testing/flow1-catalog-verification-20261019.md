# Flow 1 catalog verification — 2026-10-19

## Scope

Verified public catalog filtering through frontend Vite proxy to Supabase staging.
No reservation, invoice, payment or unit assignment was created.

Fixture writer: `scripts/db-verification/Flow1FixtureControl.java`.
All inserted unit codes use `FLOW1-DEMO-*`; existing units were not updated.

Fixture rows:

| Code | Facility | Type | Size m2 | Monthly price | Status |
|---|---|---:|---:|---:|---|
| FLOW1-DEMO-HNCG-S | HN-CG | S | 3 | 900000 | available |
| FLOW1-DEMO-HNCG-L | HN-CG | L | 8 | 1800000 | available |
| FLOW1-DEMO-Q7-M | HCM-Q7 | M | 5 | 1500000 | available |
| FLOW1-DEMO-Q7-OCC | HCM-Q7 | M | 5 | 1500000 | occupied |

Insert result: `FLOW1_FIXTURE_INSERTED`, 4 rows, one transaction.

## HTTP results

Target: `http://127.0.0.1:5174/api/facilities/units`.

| Case | Result |
|---|---|
| No filter | 200; all 3 available demo units returned |
| `facilityCode=HN-CG` | 200; HN-CG demo units only |
| `minSize=5&maxSize=5` | 200; Q7 M demo unit only |
| `minPrice=1500000&maxPrice=1500000` | 200; Q7 M demo unit only |
| Combined HN-CG, size 5–8, price 900000–1800000 | 200; HN-CG L demo unit only |
| `minSize=10&maxSize=3` | 400; invalid range rejected |
| Occupied demo unit | excluded from every available catalog result |
| PIN field | absent from response |

## Production conditions

- `facilities.code` must remain the source of valid facility filters.
- `units.facility_code` must reference an existing facility.
- Catalog exposes only `status=available`.
- Size and price bounds are inclusive and cannot be negative or reversed.
- Calendar overlap, reservation holds without assigned units and capacity races remain separate Flow 1 checks.
- Fixture cleanup requires an explicitly approved staging cleanup operation; no automatic delete was performed.
