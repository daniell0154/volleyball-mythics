--!strict
local Players = game:GetService("Players")
local Input = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")
local RunService = game:GetService("RunService")
local Config = require(game.ReplicatedStorage.MythicsShared.Config)
local Hud = {}

local function label(parent: Instance, name: string, text: string, size: UDim2, position: UDim2): TextLabel
	local item = Instance.new("TextLabel")
	item.Name, item.Text, item.Size, item.Position = name, text, size, position
	item.BackgroundTransparency = 1
	item.TextColor3 = Color3.fromRGB(244, 248, 246)
	item.Font = Enum.Font.GothamMedium
	item.TextSize = 16
	item.TextWrapped = true
	item.Parent = parent
	return item
end
local function button(parent: Instance, name: string, text: string, size: UDim2, position: UDim2): TextButton
	local item = Instance.new("TextButton")
	item.Name, item.Text, item.Size, item.Position = name, text, size, position
	item.BackgroundColor3 = Color3.fromRGB(16, 38, 45)
	item.TextColor3 = Color3.fromRGB(244, 248, 246)
	item.Font, item.TextSize, item.TextWrapped = Enum.Font.GothamMedium, 16, true
	local corner = Instance.new("UICorner")
	corner.CornerRadius, corner.Parent = UDim.new(0, 10), item
	local stroke = Instance.new("UIStroke")
	stroke.Color, stroke.Thickness, stroke.Parent = Color3.fromRGB(104, 145, 151), 1, item
	item.Parent = parent
	return item
end

function Hud.new()
	local self: any = {}
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	playerGui.ScreenOrientation = Enum.ScreenOrientation.LandscapeSensor
	local screen = Instance.new("ScreenGui")
	screen.Name, screen.ResetOnSpawn = "MythicsHUD", false
	screen.ScreenInsets = Enum.ScreenInsets.DeviceSafeInsets
	screen.ClipToDeviceSafeArea = true
	screen.Parent = playerGui
	local root = Instance.new("Frame")
	root.Name, root.Size, root.BackgroundTransparency, root.Parent = "SafeArea", UDim2.fromScale(1, 1), 1, screen
	self.screen, self.root = screen, root
	self.score = label(root, "Score", "", UDim2.fromOffset(280, 38), UDim2.new(0.5, -140, 0, 8))
	self.score.TextSize = 24
	self.status = label(root, "Status", "", UDim2.new(0.8, 0, 0, 36), UDim2.new(0.1, 0, 0, 46))
	self.feedback = label(root, "Feedback", "", UDim2.new(0.7, 0, 0, 28), UDim2.new(0.15, 0, 0, 84))
	self.feedback.TextColor3 = Color3.fromRGB(255, 222, 133)
	self.aim = button(root, "Aim", "Mira central", UDim2.fromOffset(126, 30), UDim2.new(0.5, -63, 1, -150))
	self.aim.TextSize = 13
	local grid = Instance.new("Frame")
	grid.Name, grid.AnchorPoint, grid.Position = "Actions", Vector2.new(1, 1), UDim2.new(1, -20, 1, -20)
	grid.BackgroundTransparency, grid.Parent = 1, root
	self.grid, self.actions, self.keys = grid, {}, {}
	local definitions = { {"receive", "Receber"}, {"set", "Levantar"}, {"jump", "Pular"}, {"hit", "Sacar"} }
	for index, definition in definitions do
		local item = button(grid, definition[1], "", UDim2.fromOffset(112, 58), UDim2.fromOffset(((index-1)%2)*120, math.floor((index-1)/2)*66))
		local key = label(item, "Binding", "", UDim2.new(1, -8, 0, 24), UDim2.fromOffset(4, 2))
		local icon = Instance.new("ImageLabel")
		icon.Name, icon.Size, icon.AnchorPoint, icon.Position = "Glyph", UDim2.fromOffset(22, 22), Vector2.new(0.5, 0), UDim2.fromScale(0.5, 0)
		icon.BackgroundTransparency, icon.Parent = 1, key
		local title = label(item, "ActionName", definition[2], UDim2.new(1, -8, 0, 24), UDim2.fromOffset(4, 28))
		title.TextSize = 14
		self.actions[definition[1]], self.keys[definition[1]] = item, { text = key, icon = icon }
	end
	local ability = button(root, "Ability", "", UDim2.fromOffset(112, 112), UDim2.new(0.5, 0, 1, -20))
	ability.AnchorPoint = Vector2.new(0.5, 1)
	local aspect = Instance.new("UIAspectRatioConstraint")
	aspect.AspectRatio, aspect.Parent = 1, ability
	self.ability, self.abilityValue = ability, label(ability, "Value", "◆", UDim2.new(1, 0, 1, -40), UDim2.new())
	self.abilityValue.TextSize = 30
	local edge = Instance.new("Frame")
	edge.Name, edge.Size, edge.Position = "BottomEdge", UDim2.new(1, 0, 0, 40), UDim2.new(0, 0, 1, -40)
	edge.BackgroundColor3, edge.Parent = Color3.fromRGB(29, 66, 74), ability
	self.abilityName = label(edge, "AbilityName", "Bronca no Parceiro", UDim2.new(0.72, -4, 1, -4), UDim2.fromOffset(4, 2))
	self.abilityName.TextSize = 12
	self.abilityKey = label(edge, "Binding", "U", UDim2.new(0.28, -2, 1, 0), UDim2.new(0.72, 0, 0, 0))
	self.abilityKey.TextWrapped = false
	local abilityIcon = Instance.new("ImageLabel")
	abilityIcon.Name, abilityIcon.Size, abilityIcon.AnchorPoint, abilityIcon.Position = "Glyph", UDim2.fromOffset(24, 24), Vector2.new(0.5, 0.5), UDim2.fromScale(0.5, 0.5)
	abilityIcon.BackgroundTransparency, abilityIcon.Parent = 1, self.abilityKey
	self.keys.ability = { text = self.abilityKey, icon = abilityIcon }
	self.stick = button(root, "MoveStick", "", UDim2.fromOffset(106, 106), UDim2.new(0, 30, 1, -126))
	self.stick.BackgroundTransparency = 0.25
	self.stick.Selectable = false
	self.thumb = label(self.stick, "Thumb", "●", UDim2.fromOffset(40, 40), UDim2.new(0.5, -20, 0.5, -20))
	self.thumb.TextSize = 32
	self.leave = button(root, "Leave", "Voltar", UDim2.fromOffset(90, 34), UDim2.new(0, 18, 0, 10))
	self.panel = Instance.new("Frame")
	self.panel.Name, self.panel.AnchorPoint, self.panel.Position = "SoloMenu", Vector2.new(0.5, 0.5), UDim2.fromScale(0.5, 0.5)
	self.panel.Size, self.panel.BackgroundColor3, self.panel.Parent = UDim2.fromOffset(356, 302), Color3.fromRGB(16, 38, 45), root
	local corner = Instance.new("UICorner")
	corner.CornerRadius, corner.Parent = UDim.new(0, 14), self.panel
	self.menuTitle = label(self.panel, "Title", "Solo 2v2", UDim2.new(1, 0, 0, 44), UDim2.fromOffset(0, 6))
	self.menuTitle.TextSize = 24
	self.skillChoice = button(self.panel, "SkillChoice", "", UDim2.new(1, -32, 0, 48), UDim2.fromOffset(16, 56))
	self.difficultyChoice = button(self.panel, "DifficultyChoice", "", UDim2.new(1, -32, 0, 40), UDim2.fromOffset(16, 112))
	self.sideChoice = button(self.panel, "SideChoice", "", UDim2.new(1, -32, 0, 40), UDim2.fromOffset(16, 160))
	self.start = button(self.panel, "Start", "Jogar contra bots", UDim2.new(1, -32, 0, 46), UDim2.fromOffset(16, 214))
	self.start.BackgroundColor3 = Color3.fromRGB(53, 115, 98)
	local teamInfo = label(self.panel, "TeamInfo", "Você + parceiro bot × dois bots", UDim2.new(1, 0, 0, 24), UDim2.fromOffset(0, 270))
	teamInfo.TextSize = 12
	local menuButtons = { self.skillChoice, self.difficultyChoice, self.sideChoice, self.start }
	for index, item in menuButtons do
		item.NextSelectionUp = menuButtons[(index-2)%#menuButtons+1]
		item.NextSelectionDown = menuButtons[index%#menuButtons+1]
	end
	local function focusMenu()
		task.defer(function()
			-- PlayerGui layout can still be offscreen on the first render.
			for _ = 1, 10 do
				RunService.RenderStepped:Wait()
				if root.AbsoluteSize.X > 0 and root.AbsoluteSize.Y > 0 and self.start.AbsolutePosition.X >= 0 then
					task.wait(0.1)
					break
				end
			end
			if self.panel.Visible and Input.PreferredInput == Enum.PreferredInput.Gamepad then
				GuiService.SelectedObject = self.start
			end
		end)
	end
	self.selection = { ability = "fundamentals", difficulty = "normal", team = "A" }
	local function choices()
		self.skillChoice.Text = "Habilidade · " .. Config.Abilities[self.selection.ability].name
		local names = { easy = "Fácil", normal = "Normal", hard = "Difícil" }
		self.difficultyChoice.Text = "Dificuldade · " .. names[self.selection.difficulty]
		self.sideChoice.Text = "Seu lado · " .. self.selection.team
	end
	self.skillChoice.Active = false
	self.skillChoice.AutoButtonColor = false
	self.difficultyChoice.Activated:Connect(function()
		self.selection.difficulty = ({ easy = "normal", normal = "hard", hard = "easy" })[self.selection.difficulty]
		choices()
	end)
	self.sideChoice.Activated:Connect(function() self.selection.team = if self.selection.team == "A" then "B" else "A" choices() end)
	choices()
	self.keysByAction = { receive = {Enum.KeyCode.J, Enum.KeyCode.ButtonL2}, set = {Enum.KeyCode.K, Enum.KeyCode.ButtonR1},
		jump = {Enum.KeyCode.Space, Enum.KeyCode.ButtonA}, hit = {Enum.KeyCode.L, Enum.KeyCode.ButtonR2}, ability = {Enum.KeyCode.U, Enum.KeyCode.ButtonL1} }
	self.refresh = function()
		local touch = Input.PreferredInput == Enum.PreferredInput.Touch
		local gamepad = Input.PreferredInput == Enum.PreferredInput.Gamepad
		local compact = root.AbsoluteSize.Y < 500
		self.panel.Size = UDim2.fromOffset(356, if compact then 252 else 302)
		self.menuTitle.Size = UDim2.new(1, 0, 0, if compact then 32 else 44)
		for index, item in menuButtons do
			local y = if compact then 40+(index-1)*48 else ({56,112,160,214})[index]
			item.Position = UDim2.fromOffset(16,y)
			item.Size = UDim2.new(1,-32,0,if compact then 44 else ({48,40,40,46})[index])
		end
		teamInfo.Position = UDim2.fromOffset(0,if compact then 228 else 270)
		local cellW, cellH = if compact then 72 else 88, 48
		grid.Size = UDim2.fromOffset(cellW*2+8, cellH*2+8)
		for index, definition in definitions do
			local item = self.actions[definition[1]]
			item.Size = UDim2.fromOffset(cellW, cellH)
			item.Position = UDim2.fromOffset(((index-1)%2)*(cellW+8), math.floor((index-1)/2)*(cellH+8))
		end
		local square = if compact then 72 else 84
		ability.Size = UDim2.fromOffset(square, square)
		self.abilityName.TextSize = if compact then 10 else 11
		self.abilityKey.TextSize = if touch then 8 else 14
		self.abilityName.Size = UDim2.new(if touch then 0.65 else 0.72, -4, 1, -4)
		self.abilityKey.Size = UDim2.new(if touch then 0.35 else 0.28, -2, 1, 0)
		self.abilityKey.Position = UDim2.new(if touch then 0.65 else 0.72, 0, 0, 0)
		self.abilityValue.TextSize = 24
		self.abilityValue.Size = UDim2.new(1, 0, 1, -34)
		edge.Size, edge.Position = UDim2.new(1, 0, 0, 34), UDim2.new(0, 0, 1, -34)
		self.aim.Position = UDim2.new(0.5, -63, 1, -(square + 54))
		local margin = if gamepad then math.max(20, root.AbsoluteSize.X * 0.045) else 20
		grid.Position = UDim2.new(1, -margin, 1, -20)
		local topMargin = if gamepad then math.max(8, root.AbsoluteSize.Y * 0.045) else 8
		self.leave.Position = UDim2.fromOffset(if gamepad then margin else 18, topMargin)
		self.score.Position = UDim2.new(0.5, -140, 0, topMargin)
		self.status.Position = UDim2.new(0.1, 0, 0, topMargin+38)
		self.feedback.Position = UDim2.new(0.15, 0, 0, topMargin+76)
		self.stick.Visible = touch and not self.panel.Visible
		for name, binding in self.keys do
			local code = self.keysByAction[name][if gamepad then 2 else 1]
			binding.icon.Visible = gamepad
			binding.text.Text = if touch then (if name == "ability" then "Toque" else "Toque") else Input:GetStringForKeyCode(code)
			if gamepad then
				local image = Input:GetImageForKeyCode(code)
				binding.icon.Image = image
				binding.icon.Visible = image ~= ""
				if image ~= "" then binding.text.Text = "" end
			end
		end
	end
	root:GetPropertyChangedSignal("AbsoluteSize"):Connect(self.refresh)
	Input:GetPropertyChangedSignal("PreferredInput"):Connect(function()
		self.refresh()
		focusMenu()
	end)
	self.setMenu = function(visible: boolean, title: string?)
		self.panel.Visible = visible
		self.menuTitle.Text = title or "Solo 2v2"
		self.start.Text = if title then "Jogar novamente" else "Jogar contra bots"
		self.grid.Visible, self.ability.Visible, self.aim.Visible = not visible, not visible, not visible
		self.leave.Visible = not visible
		self.refresh()
		if visible then focusMenu() end
	end
	self.update = function(state: any)
		self.score.Text = state.score.A .. "  ×  " .. state.score.B
		local names = {
			countdown = "Começa em " .. math.max(1, math.ceil((180-state.phaseTicks)/60)),
			serving = "Saque · " .. state.servingSide .. (state.servingSlot+1), rally = "Rally",
			point = "Ponto · próximo saque em " .. math.max(1, math.ceil((120-state.phaseTicks)/60)),
			finished = "Fim da partida",
		}
		self.status.Text = names[state.phase] or ""
		if state.warmup then self.status.Text = "Aguardando adversário · aquecimento" self.score.Text = ""
		elseif state.suspended then self.status.Text = "Aguardando reconexão · partida pausada"
		elseif state.pending then self.status.Text = "Você entra no próximo saque" end
		local reasons = { consecutive_player = "Dois toques seguidos do mesmo jogador", fourth_touch = "Quarto toque" }
		self.feedback.Text = reasons[state.feedback] or state.feedback
		if state.abilityFallback and (state.warmup or state.phase == "countdown") then
			self.feedback.Text = "Fundamentos equipada para o duelo. Sua assinatura requer dupla."
		end
		self.actions.hit.ActionName.Text = if state.phase == "serving" then "Sacar" else "Atacar"
		self.abilityName.Text = Config.Abilities[state.abilityId].name
		local seconds = math.max(0, math.ceil((state.cooldownUntil-state.tick)/60))
		self.abilityValue.Text = if seconds > 0 then seconds .. "s" elseif state.phase == "rally" then "◆" else "—"
		if state.abilityId == "fundamentals" then self.abilityValue.Text = "Base" end
		self.ability.BackgroundColor3 = if seconds > 0 then Color3.fromRGB(49, 58, 63) else Color3.fromRGB(16, 38, 45)
	end
	self.setMenu(true)
	return self
end

return Hud
