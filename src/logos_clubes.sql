-- Logos FC Porto, Sporting CP, SL Benfica nos pedidos
UPDATE club_requests SET logo_url = 'https://upload.wikimedia.org/wikipedia/pt/4/42/FC_Porto.png' WHERE clube ILIKE '%porto%';
UPDATE club_requests SET logo_url = 'https://upload.wikimedia.org/wikipedia/pt/4/47/Sporting_CP.png' WHERE clube ILIKE '%sporting%';
UPDATE club_requests SET logo_url = 'https://upload.wikimedia.org/wikipedia/pt/9/af/SL_Benfica.png' WHERE clube ILIKE '%benfica%';

-- Verificar
SELECT clube, logo_url FROM club_requests WHERE logo_url IS NOT NULL;
