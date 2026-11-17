-- Generated from content/characters/initial.json by node scripts/roster.mjs sql.
-- Versioned catalog only. Ability handlers are implemented in feature 006.
begin;
insert into public.characters (id,version,name,serve,receive,set_skill,attack,block,speed,jump,ability_id,ability_config,asset_key,enabled) values
('samuel',1,'Samuel',88,80,82,90,83,86,86,'teammate_rant','{"name":"Bronca no Parceiro","description":"Xinga o companheiro de equipe e reduz temporariamente sua velocidade e recepção.","trigger":"manual","validPhases":["rally"],"target":"teammate","affectedAttributes":["speed","receive"],"multiplier":0.85,"durationSeconds":5,"cooldownSeconds":20,"stackable":false,"withoutTeammate":"unavailable_without_cooldown","feedback":"Balão de bronca no Samuel e ícone de debuff no companheiro."}'::jsonb,'procedural:v1:male:2626328580',true),
('caio',1,'Caio',72,78,79,75,76,80,79,'free_point_out','{"name":"Foi Sem Querer","description":"Joga a bola para fora e entrega um ponto grátis à equipe adversária.","trigger":"manual","validPhases":["rally"],"target":"opponent_team","effect":"force_ball_out","requiresBallInActionRange":true,"points":1,"pointPolicy":"opponent_once_on_rally_resolution","durationSeconds":0,"cooldownSeconds":25,"endsRally":true,"stackable":false,"feedback":"Trajetória exagerada para fora e reação de constrangimento."}'::jsonb,'procedural:v1:male:2016838844',true)
on conflict (id,version) do nothing;
commit;
