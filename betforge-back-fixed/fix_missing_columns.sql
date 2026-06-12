-- Script de correção rápida: aplica as colunas que faltam na tabela matches
-- Execute no banco betforge_db se preferir não rodar a migration via Node

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='league_label'
  ) THEN
    ALTER TABLE matches ADD COLUMN league_label VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='league_flag'
  ) THEN
    ALTER TABLE matches ADD COLUMN league_flag VARCHAR(10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='round'
  ) THEN
    ALTER TABLE matches ADD COLUMN round VARCHAR(80);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='home_emoji'
  ) THEN
    ALTER TABLE matches ADD COLUMN home_emoji VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='away_emoji'
  ) THEN
    ALTER TABLE matches ADD COLUMN away_emoji VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='markets_count'
  ) THEN
    ALTER TABLE matches ADD COLUMN markets_count INTEGER DEFAULT 0;
  END IF;

  RAISE NOTICE '✅ Colunas verificadas e adicionadas se necessário.';
END $$;
