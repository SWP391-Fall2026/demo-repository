# Demo flow Staff check-in

Apply `database/migrations/006_staff_checkin_contract_flow.sql` first. Do not run demo seed against production.

PowerShell from `backend`:

```powershell
$env:DEMO_SEED_PASSWORD = "<local-demo-password-at-least-12-chars>"
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=auth-supabase,demo-seed"
```

Seed creates only missing records:

- Manager: `manager_demo_hncg` at `HN-CG`
- Staff: `staff_demo_hncg` at `HN-CG`
- Unit: `HN-CG-001`
- Facility check-in PIN: generated demo seed value `246810` and stored hashed

1. Customer pays `DEPOSIT`; system creates `CHECKIN` task.
2. Manager opens workforce assignment and assigns the check-in task to demo Staff.
3. Staff opens assigned task, visually compares the customer's physical CCCD/ID with the customer record, checks appointment-card code against the task, and confirms both checks. Staff does not enter or store CCCD or PINs.
4. Customer opens contract offer, reviews customer/facility/unit/policy snapshot and accepts terms.
5. Backend issues `RENT` invoice. Customer pays it through same payment method.
6. Staff completes handover. Backend creates `ACTIVE` contract, marks unit `OCCUPIED`, clears temporary PIN, and issues permanent contract PIN.

Demo password is read from `DEMO_SEED_PASSWORD`; never commit it or use this seed profile in production.
