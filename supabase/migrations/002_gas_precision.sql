-- Gas meter readings are in m³ and need 3 decimal places of precision.
-- Widen reading_kwh from numeric(10,2) to numeric(10,3).
ALTER TABLE meter_readings ALTER COLUMN reading_kwh TYPE numeric(10,3);
