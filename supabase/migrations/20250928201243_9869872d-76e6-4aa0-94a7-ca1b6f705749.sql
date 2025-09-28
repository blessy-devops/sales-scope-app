-- Remove a constraint problemática que impede salvar targets de sub-canais
ALTER TABLE public.sales_targets DROP CONSTRAINT IF EXISTS channel_or_sub_channel_check;

-- Comentário: Esta constraint estava impedindo salvar targets onde tanto channel_id quanto sub_channel_id 
-- estavam preenchidos, o que é necessário para sub-canais.