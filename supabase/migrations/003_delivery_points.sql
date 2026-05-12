-- Upsert the 3 official delivery points for La Sabana campus
-- Existing rows with same name are updated to is_active = true

INSERT INTO delivery_points (name, description, is_active, security_level)
VALUES
  ('Puente de la Clínica', 'Puente peatonal frente a la Clínica de la Sabana', true, 'low'),
  ('Puente de Ad Portas',  'Puente peatonal de Ad Portas',                      true, 'low'),
  ('Entrada peatonal del CA', 'Entrada peatonal del Centro de Alumnos',         true, 'low')
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Deactivate any other delivery points not in the approved list
UPDATE delivery_points
SET is_active = false
WHERE name NOT IN (
  'Puente de la Clínica',
  'Puente de Ad Portas',
  'Entrada peatonal del CA'
);
