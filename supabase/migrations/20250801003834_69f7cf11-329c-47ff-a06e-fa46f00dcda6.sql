-- Primeiro, adicionar o campo parent_id à tabela channels para suportar hierarquia
ALTER TABLE public.channels 
ADD COLUMN parent_id uuid REFERENCES public.channels(id);

-- Limpar dados existentes para evitar conflitos
DELETE FROM public.channels;

-- Inserir canais principais
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('E-COMMERCE', 'E-commerce', true, NULL),
('MARKETPLACES', 'Marketplace', true, NULL),
('TIKTOK SHOP', 'Marketplace', true, NULL),
('LANDING PAGES', 'Landing Page', true, NULL),
('B2B', 'E-commerce', true, NULL);

-- Inserir subcanais do E-COMMERCE
WITH ecommerce AS (SELECT id FROM public.channels WHERE name = 'E-COMMERCE')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('Influencers', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Creators', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Creators pagas', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Afiliados', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Instagram', 'E-commerce', true, (SELECT id FROM ecommerce)),
('E-mail Marketing', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Meta Ads', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Google Ads', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Tiktok Ads', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Pinterest Ads', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Google Orgânico', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Atendimento / Comercial', 'E-commerce', true, (SELECT id FROM ecommerce)),
('WhatsApp - Grupos', 'E-commerce', true, (SELECT id FROM ecommerce)),
('WhatsApp - Api Oficial', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Tiktok', 'E-commerce', true, (SELECT id FROM ecommerce)),
('Direto / Sem Origem', 'E-commerce', true, (SELECT id FROM ecommerce));

-- Inserir subcanais dos MARKETPLACES
WITH marketplaces AS (SELECT id FROM public.channels WHERE name = 'MARKETPLACES')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('Amazon', 'Marketplace', true, (SELECT id FROM marketplaces)),
('Mercado Livre', 'Marketplace', true, (SELECT id FROM marketplaces)),
('RD Saúde', 'Marketplace', true, (SELECT id FROM marketplaces));

-- Inserir subcanais do TIKTOK SHOP
WITH tiktokshop AS (SELECT id FROM public.channels WHERE name = 'TIKTOK SHOP')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('Orgânico', 'Marketplace', true, (SELECT id FROM tiktokshop)),
('Pago', 'Marketplace', true, (SELECT id FROM tiktokshop));

-- Inserir subcanais das LANDING PAGES
WITH landingpages AS (SELECT id FROM public.channels WHERE name = 'LANDING PAGES')
INSERT INTO public.channels (name, type, is_active, parent_id) VALUES
('B4You', 'Landing Page', true, (SELECT id FROM landingpages)),
('Payt', 'Landing Page', true, (SELECT id FROM landingpages));