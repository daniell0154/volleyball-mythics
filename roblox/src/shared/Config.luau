--!strict
-- Immutable rules for a match, derived from the browser's profile 4.
return table.freeze({
	Step = 1 / 60,
	Scale = 3.5,
	Origin = Vector3.new(0, 2, 0),
	Attributes = table.freeze({ serve = 70, receive = 70, set = 70, attack = 70, block = 70, speed = 70, jump = 70 }),
	Abilities = table.freeze({
		teammate_rant = table.freeze({ name = "Bronca no Parceiro", cooldown = 20, duration = 5 }),
		free_point_out = table.freeze({ name = "Foi Sem Querer", cooldown = 25, duration = 0 }),
	}),
})
