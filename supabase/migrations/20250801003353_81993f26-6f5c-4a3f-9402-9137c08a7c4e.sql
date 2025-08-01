-- Primeiro, adicionar o campo parent_id à tabela channels para suportar hierarquia
ALTER TABLE public.channels 
ADD COLUMN parent_id uuid REFERENCES public.channels(id);

-- Limpar dados existentes para evitar conflitos
DELETE FROM public.channels;

-- Inserir canais principais
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('E-COMMERCE', 'e-commerce', true, NULL),
('MARKETPLACES', 'marketplace', true, NULL),
('TIKTOK SHOP', 'marketplace', true, NULL),
('LANDING PAGES', 'landing-page', true, NULL),
('B2B', 'b2b', true, NULL);

-- Inserir subcanais do E-COMMERCE
WITH ecommerce AS (SELECT id FROM public.channels WHERE name = 'E-COMMERCE')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('Influencers', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Creators', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Creators pagas', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Afiliados', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Instagram', 'e-commerce', true, (SELECT id FROM ecommerce)),
('E-mail Marketing', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Meta Ads', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Google Ads', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Tiktok Ads', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Pinterest Ads', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Google Orgânico', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Atendimento / Comercial', 'e-commerce', true, (SELECT id FROM ecommerce)),
('WhatsApp - Grupos', 'e-commerce', true, (SELECT id FROM ecommerce)),
('WhatsApp - Api Oficial', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Tiktok', 'e-commerce', true, (SELECT id FROM ecommerce)),
('Direto / Sem Origem', 'e-commerce', true, (SELECT id FROM ecommerce));

-- Inserir subcanais dos MARKETPLACES
WITH marketplaces AS (SELECT id FROM public.channels WHERE name = 'MARKETPLACES')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('Amazon', 'marketplace', true, (SELECT id FROM marketplaces)),
('Mercado Livre', 'marketplace', true, (SELECT id FROM marketplaces)),
('RD Saúde', 'marketplace', true, (SELECT id FROM marketplaces));

-- Inserir subcanais do TIKTOK SHOP
WITH tiktokshop AS (SELECT id FROM public.channels WHERE name = 'TIKTOK SHOP')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('Orgânico', 'marketplace', true, (SELECT id FROM tiktokshop)),
('Pago', 'marketplace', true, (SELECT id FROM tiktokshop));

-- Inserir subcanais das LANDING PAGES
WITH landingpages AS (SELECT id FROM public.channels WHERE name = 'LANDING PAGES')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('B4You', 'landing-page', true, (SELECT id FROM landingpages)),
('Payt', 'landing-page', true, (SELECT id FROM landingpages));