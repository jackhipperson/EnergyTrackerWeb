-- EnergyTracker initial schema
-- Run this in the Supabase SQL editor

CREATE TABLE tariffs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fuel_type       text CHECK (fuel_type IN ('electricity', 'gas')) NOT NULL,
  supplier        text,
  unit_rate       numeric(10,4) NOT NULL,
  standing_charge numeric(10,4) NOT NULL,
  valid_from      date NOT NULL,
  valid_to        date,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE meter_readings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fuel_type    text CHECK (fuel_type IN ('electricity', 'gas')) NOT NULL,
  reading_date date NOT NULL,
  reading_kwh  numeric(10,2) NOT NULL,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, fuel_type, reading_date)
);

ALTER TABLE tariffs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_tariffs"  ON tariffs        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_readings" ON meter_readings  FOR ALL USING (auth.uid() = user_id);
