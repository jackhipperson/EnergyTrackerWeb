-- Demo seed data for demo@demo.com
-- Run in Supabase SQL editor AFTER creating the user via
-- Authentication → Users → Add user (email: demo@demo.com, password: password)
--
-- Readings use a mix of 1st-of-month and mid-month dates to exercise:
--   (a) Pro-rating: periods that cross a month boundary are split by day
--   (b) Partial month: last reading is Dec 28 → December is extrapolated (marked *)
--
-- ── TARIFFS ───────────────────────────────────────────────────────────────────
--   Electricity: 28.50 p/kWh,  40.00 p/day standing charge
--   Gas:          6.80 p/kWh,  29.00 p/day standing charge
--
-- ── ELECTRICITY ───────────────────────────────────────────────────────────────
--   Constant 10 kWh/day throughout.
--   Cost per day = (10 × 28.50 + 40.00) / 100 = £3.25/day (constant)
--   → each complete month: kWh = days_in_month × 10, £ = days_in_month × 3.25
--
-- ── GAS ───────────────────────────────────────────────────────────────────────
--   GAS_M3_TO_KWH = (1.02264 × 38.9) / 3.6 = 11.050193...
--   Daily rates (m³/day) vary by period to model seasonal use:
--     3 m³/day → £2.5442/day   (3 × 11.050193 × 6.80 + 29) / 100
--     2 m³/day → £1.7928/day
--     1 m³/day → £1.0414/day
--
-- ── PERIOD TABLE (how the pro-rating works) ───────────────────────────────────
-- Period              Days  Elec kWh  Gas rate  Gas m³
-- Jan 01 → Jan 20      19     190     3 m³/day    57
-- Jan 20 → Feb 15      26     260     3 m³/day    78   ← crosses Jan/Feb
-- Feb 15 → Mar 01      15     150     2 m³/day    30   ← crosses Feb/Mar
-- Mar 01 → Apr 08      38     380     2 m³/day    76   ← crosses Mar/Apr
-- Apr 08 → May 01      23     230     1 m³/day    23   ← crosses Apr/May
-- May 01 → Jun 12      42     420     1 m³/day    42   ← crosses May/Jun
-- Jun 12 → Jul 01      19     190     1 m³/day    19   ← crosses Jun/Jul
-- Jul 01 → Aug 20      50     500     1 m³/day    50   ← crosses Jul/Aug
-- Aug 20 → Sep 01      12     120     2 m³/day    24   ← crosses Aug/Sep
-- Sep 01 → Oct 18      47     470     2 m³/day    94   ← crosses Sep/Oct
-- Oct 18 → Nov 01      14     140     3 m³/day    42   ← crosses Oct/Nov
-- Nov 01 → Dec 16      45     450     3 m³/day   135   ← crosses Nov/Dec
-- Dec 16 → Dec 28      12     120     3 m³/day    36   (partial — Dec 28 is last reading)
--
-- ── EXPECTED MONTHLY BREAKDOWN (what the dashboard should display) ─────────────
-- Pro-rating allocates each period's kWh/cost proportionally to each calendar month.
-- December is extrapolated: 27 actual days → scaled ×(31/27) to fill the month.
--
-- ┌──────────┬──────────┬──────────┬──────────┬──────────┐
-- │ Month    │ Elec kWh │ Elec £   │ Gas kWh  │ Gas £    │
-- ├──────────┼──────────┼──────────┼──────────┼──────────┤
-- │ Jan 2024 │  310     │ £100.75  │ 1027.67  │  £78.87  │  31 days × 10kWh, 93m³ all @3
-- │ Feb 2024 │  290     │  £94.25  │  795.61  │  £62.51  │  29 days; 42m³@3 + 30m³@2
-- │ Mar 2024 │  310     │ £100.75  │  685.11  │  £55.58  │  31 days × 2m³
-- │ Apr 2024 │  300     │  £97.50  │  408.86  │  £36.50  │  7d×2m³ + 23d×1m³
-- │ May 2024 │  310     │ £100.75  │  342.56  │  £32.28  │  31 days × 1m³
-- │ Jun 2024 │  300     │  £97.50  │  331.51  │  £31.24  │  30 days × 1m³
-- │ Jul 2024 │  310     │ £100.75  │  342.56  │  £32.28  │  31 days × 1m³
-- │ Aug 2024 │  310     │ £100.75  │  475.16  │  £41.30  │  19d×1m³ + 12d×2m³
-- │ Sep 2024 │  300     │  £97.50  │  663.01  │  £53.78  │  30 days × 2m³
-- │ Oct 2024 │  310     │ £100.75  │  839.81  │  £66.10  │  17d×2m³ + 14d×3m³
-- │ Nov 2024 │  300     │  £97.50  │  994.52  │  £76.33  │  30 days × 3m³
-- │ Dec 2024*│  310     │ £100.75  │ 1027.67  │  £78.87  │  27 actual days → ×(31/27)
-- ├──────────┼──────────┼──────────┼──────────┼──────────┤
-- │ TOTAL    │ 3660     │£1189.50  │ 7934.04  │ £645.65  │
-- └──────────┴──────────┴──────────┴──────────┴──────────┘
-- * Estimated — extrapolated from partial month data

DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'demo@demo.com';

  IF uid IS NULL THEN
    RAISE EXCEPTION 'User demo@demo.com not found. Create via Authentication → Users → Add user.';
  END IF;

  DELETE FROM meter_readings WHERE user_id = uid;
  DELETE FROM tariffs        WHERE user_id = uid;

  -- ── Tariffs ──────────────────────────────────────────────────────────────────
  INSERT INTO tariffs (user_id, fuel_type, supplier, unit_rate, standing_charge, valid_from, valid_to)
  VALUES
    (uid, 'electricity', 'Demo Energy', 28.50, 40.00, '2024-01-01', NULL),
    (uid, 'gas',         'Demo Energy',  6.80, 29.00, '2024-01-01', NULL);

  -- ── Electricity readings (cumulative kWh, 10 kWh/day constant) ───────────────
  INSERT INTO meter_readings (user_id, fuel_type, reading_date, reading_kwh)
  VALUES
    (uid, 'electricity', '2024-01-01', 10000.00),
    (uid, 'electricity', '2024-01-20', 10190.00),  -- +190  (19d)
    (uid, 'electricity', '2024-02-15', 10450.00),  -- +260  (26d, crosses Jan/Feb)
    (uid, 'electricity', '2024-03-01', 10600.00),  -- +150  (15d, crosses Feb/Mar)
    (uid, 'electricity', '2024-04-08', 10980.00),  -- +380  (38d, crosses Mar/Apr)
    (uid, 'electricity', '2024-05-01', 11210.00),  -- +230  (23d, crosses Apr/May)
    (uid, 'electricity', '2024-06-12', 11630.00),  -- +420  (42d, crosses May/Jun)
    (uid, 'electricity', '2024-07-01', 11820.00),  -- +190  (19d, crosses Jun/Jul)
    (uid, 'electricity', '2024-08-20', 12320.00),  -- +500  (50d, crosses Jul/Aug)
    (uid, 'electricity', '2024-09-01', 12440.00),  -- +120  (12d, crosses Aug/Sep)
    (uid, 'electricity', '2024-10-18', 12910.00),  -- +470  (47d, crosses Sep/Oct)
    (uid, 'electricity', '2024-11-01', 13050.00),  -- +140  (14d, crosses Oct/Nov)
    (uid, 'electricity', '2024-12-16', 13500.00),  -- +450  (45d, crosses Nov/Dec)
    (uid, 'electricity', '2024-12-28', 13620.00);  -- +120  (12d, partial Dec — last reading)

  -- ── Gas readings (cumulative m³, 3 decimal places) ───────────────────────────
  INSERT INTO meter_readings (user_id, fuel_type, reading_date, reading_kwh)
  VALUES
    (uid, 'gas', '2024-01-01',  500.000),
    (uid, 'gas', '2024-01-20',  557.000),  -- +57  (19d @ 3m³/d)
    (uid, 'gas', '2024-02-15',  635.000),  -- +78  (26d @ 3m³/d, crosses Jan/Feb)
    (uid, 'gas', '2024-03-01',  665.000),  -- +30  (15d @ 2m³/d, crosses Feb/Mar)
    (uid, 'gas', '2024-04-08',  741.000),  -- +76  (38d @ 2m³/d, crosses Mar/Apr)
    (uid, 'gas', '2024-05-01',  764.000),  -- +23  (23d @ 1m³/d, crosses Apr/May)
    (uid, 'gas', '2024-06-12',  806.000),  -- +42  (42d @ 1m³/d, crosses May/Jun)
    (uid, 'gas', '2024-07-01',  825.000),  -- +19  (19d @ 1m³/d, crosses Jun/Jul)
    (uid, 'gas', '2024-08-20',  875.000),  -- +50  (50d @ 1m³/d, crosses Jul/Aug)
    (uid, 'gas', '2024-09-01',  899.000),  -- +24  (12d @ 2m³/d, crosses Aug/Sep)
    (uid, 'gas', '2024-10-18',  993.000),  -- +94  (47d @ 2m³/d, crosses Sep/Oct)
    (uid, 'gas', '2024-11-01', 1035.000),  -- +42  (14d @ 3m³/d, crosses Oct/Nov)
    (uid, 'gas', '2024-12-16', 1170.000),  -- +135 (45d @ 3m³/d, crosses Nov/Dec)
    (uid, 'gas', '2024-12-28', 1206.000);  -- +36  (12d @ 3m³/d, partial Dec — last reading)

  RAISE NOTICE 'Demo data seeded successfully for %', uid;
END $$;
