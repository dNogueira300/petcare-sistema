-- Parche: hacer id_historia_clinica nullable en seguimientos_clinicos
-- Ejecutar en Supabase si la tabla ya fue creada con NOT NULL
ALTER TABLE seguimientos_clinicos
  ALTER COLUMN id_historia_clinica DROP NOT NULL;
