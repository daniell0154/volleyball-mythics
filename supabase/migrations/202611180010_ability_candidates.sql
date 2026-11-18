begin;

-- Availability is granted after the balance and presentation review.
insert into public.roster_abilities (id, ability_config) values
 ('coffee_break', '{"name":"Café no Intervalo","description":"O próprio atleta corre 15% mais rápido.","trigger":"manual","validPhases":["rally"],"target":"self","attribute":"speed","multiplier":1.15,"durationSeconds":3,"cooldownSeconds":22,"stackable":false}'::jsonb),
 ('butter_fingers', '{"name":"Mão de Manteiga","description":"Reduz em 15% o alcance de recepção e bloqueio do próprio atleta.","trigger":"manual","validPhases":["rally"],"target":"self","attribute":"receive","multiplier":0.85,"durationSeconds":4,"cooldownSeconds":18,"stackable":false}'::jsonb),
 ('my_ball', '{"name":"Minha Bola!","description":"Aumenta em 10% o alcance de recepção e bloqueio do parceiro ativo.","trigger":"manual","validPhases":["rally"],"target":"teammate","attribute":"receive","multiplier":1.10,"durationSeconds":4,"cooldownSeconds":24,"stackable":false}'::jsonb);

commit;
