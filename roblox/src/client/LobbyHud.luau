--!strict
local Players = game:GetService("Players")
local Input = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")
local TweenService = game:GetService("TweenService")
local Marketplace = game:GetService("MarketplaceService")
local Config = require(game.ReplicatedStorage.MythicsShared.Config)
local LobbyHud = {}
local cream, ink = Color3.fromRGB(244, 233, 205), Color3.fromRGB(20, 38, 46)
local gold, teal = Color3.fromRGB(246, 199, 77), Color3.fromRGB(54, 118, 122)

local function text(parent: Instance, name: string, value: string, y: number, height: number): TextLabel
	local item = Instance.new("TextLabel")
	item.Name, item.Text = name, value
	item.Position, item.Size = UDim2.fromOffset(20, y), UDim2.new(1, -40, 0, height)
	item.BackgroundTransparency, item.TextColor3, item.TextWrapped = 1, cream, true
	item.TextXAlignment, item.Font, item.TextSize = Enum.TextXAlignment.Left, Enum.Font.GothamMedium, 14
	item.Parent = parent
	return item
end
local function button(parent: Instance, name: string, value: string, y: number): TextButton
	local item = Instance.new("TextButton")
	item.Name, item.Text = name, value
	item.Position, item.Size = UDim2.fromOffset(20, y), UDim2.new(1, -40, 0, 46)
	item.BackgroundColor3, item.TextColor3 = teal, cream
	item.Font, item.TextSize, item.TextWrapped = Enum.Font.GothamBold, 15, true
	local corner = Instance.new("UICorner")
	corner.CornerRadius, corner.Parent = UDim.new(0, 8), item
	local stroke = Instance.new("UIStroke")
	stroke.Color, stroke.Thickness, stroke.Parent = gold, 0, item
	item.SelectionGained:Connect(function() stroke.Thickness = 3 end)
	item.SelectionLost:Connect(function() stroke.Thickness = 0 end)
	item.Parent = parent
	return item
end

function LobbyHud.new(hud: any)
	local self: any = { visible = true, busy = false, reduced = false, volume = 0.5, catalog = nil }
	local root = Instance.new("Frame")
	root.Name, root.Size, root.BackgroundTransparency, root.Parent = "Lobby", UDim2.fromScale(1, 1), 1, hud.root
	local identity = text(root, "Player", Players.LocalPlayer.DisplayName, 18, 28)
	identity.TextColor3, identity.Size = gold, UDim2.fromOffset(250, 28)
	local function updateFrame()
		local value = Players.LocalPlayer:GetAttribute("CardFrameColor")
		identity.BackgroundTransparency = if value then 0.15 else 1
		if typeof(value) == "Color3" then identity.BackgroundColor3 = value end
	end
	Players.LocalPlayer:GetAttributeChangedSignal("CardFrameColor"):Connect(updateFrame)
	updateFrame()
	local nav = Instance.new("Frame")
	nav.Name, nav.Size, nav.Position, nav.BackgroundTransparency, nav.Parent = "Navigation", UDim2.fromOffset(226, 232), UDim2.new(0, 0, 1, -244), 1, root
	local names = { {"Play", "JOGAR"}, {"Signatures", "ASSINATURAS"}, {"Shop", "LOJA"}, {"Settings", "CONFIGURAÇÕES"} }
	local accents = { Color3.fromRGB(103, 255, 70), Color3.fromRGB(212, 80, 255), gold, Color3.fromRGB(81, 213, 255) }
	local buttons, panels = {}, {}
	local selected: string? = nil
	local returnTo: GuiObject? = nil
	local sound = Instance.new("Sound")
	sound.Name, sound.SoundId, sound.Volume, sound.Parent = "MenuClick", "rbxasset://sounds/electronicpingshort.wav", self.volume, root
	local function click() sound.Volume = self.volume sound:Play() end
	local function focus(item: GuiObject?)
		if Input.PreferredInput == Enum.PreferredInput.Gamepad then
			task.defer(function()
				game:GetService("RunService").RenderStepped:Wait()
				if self.visible then GuiService.SelectedObject = item end
			end)
		end
	end
	local function link(items: { GuiObject })
		for index, item in items do
			item.NextSelectionDown = items[index % #items + 1]
			item.NextSelectionUp = items[(index - 2) % #items + 1]
		end
	end
	local close = button(root, "ClosePanel", "Voltar", 0)
	close.Size, close.Position, close.Visible = UDim2.fromOffset(104, 40), UDim2.new(1, -124, 0, 16), false
	local tween: Tween? = nil
	local function open(name: string?)
		if self.busy then return end
		if tween then tween:Cancel() end
		selected = name
		nav.Visible = true
		hud.stick.Visible = name == nil and Input.PreferredInput == Enum.PreferredInput.Touch
		hud.panel.Visible = false
		for key, panel in panels do panel.Visible = key == name end
		close.Visible = name ~= nil
		if name then
			returnTo = buttons[name] or returnTo
			local panel = panels[name]
			local items = {}
			for _, child in panel:GetChildren() do
				if child:IsA("TextButton") then table.insert(items, child) end
			end
			table.sort(items, function(a, b) return a.Position.Y.Offset < b.Position.Y.Offset end)
			table.insert(items, close)
			link(items)
			panel.BackgroundTransparency = if self.reduced then 0.04 else 0.5
			if not self.reduced then
				tween = TweenService:Create(panel, TweenInfo.new(0.18), {BackgroundTransparency = 0.04})
				tween:Play()
			end
			focus(panel:FindFirstChildWhichIsA("TextButton") or close)
		else
			focus(returnTo or buttons.Play)
		end
	end
	self.back = function()
		if hud.panel.Visible then hud.panel.Visible = false open("Play") else open(nil) end
	end
	close.Activated:Connect(function() click() self.back() end)
	for index, definition in names do
		local item = button(nav, definition[1], definition[2], (index - 1) * 54)
		item.Text, item.BackgroundTransparency = "", 1
		item:FindFirstChildOfClass("UIStroke"):Destroy()
		local accent = accents[index]
		for layer = 1, 2 do
			for rotation = 0, 2 do
				local hex = Instance.new("Frame")
				local width = if layer == 1 then 66 else 59
				hex.Name, hex.Size, hex.AnchorPoint, hex.Position = "Hex", UDim2.fromOffset(width, width * 0.577), Vector2.new(0.5, 0.5), UDim2.new(0.5, 0, 0, 38)
				hex.Rotation, hex.BackgroundColor3, hex.BorderSizePixel = rotation * 60, if layer == 1 then accent else ink, 0
				hex.ZIndex, hex.Parent = layer + 1, item
			end
		end
		local icon = Instance.new("TextLabel")
		icon.Name, icon.BackgroundTransparency, icon.Size, icon.Position = "Icon", 1, UDim2.fromOffset(64, 56), UDim2.new(0.5, -32, 0, 10)
		icon.Text, icon.Font, icon.TextSize, icon.TextColor3 = ({"▶", "", "", "⚙"})[index], Enum.Font.GothamBlack, 34, accent
		icon.ZIndex, icon.Parent = 5, item
		if index == 2 then
			local circle = Instance.new("Frame")
			circle.Size, circle.Position, circle.BackgroundColor3 = UDim2.fromOffset(31, 31), UDim2.fromOffset(16, 12), cream
			circle.ZIndex, circle.Parent = 5, icon
			local corner = Instance.new("UICorner")
			corner.CornerRadius, corner.Parent = UDim.new(1, 0), circle
			for seamIndex = 1, 3 do
				local seam = Instance.new("Frame")
				seam.Size, seam.Position, seam.Rotation = UDim2.fromOffset(27, 2), UDim2.fromOffset(2, seamIndex * 7), 20
				seam.BackgroundColor3, seam.BorderSizePixel, seam.ZIndex, seam.Parent = accent, 0, 6, circle
			end
		elseif index == 3 then
			local bag = Instance.new("Frame")
			bag.Size, bag.Position, bag.BackgroundColor3 = UDim2.fromOffset(30, 25), UDim2.fromOffset(17, 22), gold
			bag.ZIndex, bag.Parent = 5, icon
			local handle = Instance.new("Frame")
			handle.Size, handle.Position, handle.BackgroundTransparency = UDim2.fromOffset(16, 13), UDim2.fromOffset(7, -9), 1
			handle.ZIndex, handle.Parent = 5, bag
			local stroke = Instance.new("UIStroke")
			stroke.Thickness, stroke.Color, stroke.Parent = 3, gold, handle
		end
		local caption = text(item, "Caption", definition[2], 78, 24)
		caption.Position, caption.Size, caption.TextSize, caption.TextXAlignment = UDim2.fromOffset(-8, 78), UDim2.new(1, 16, 0, 24), 10, Enum.TextXAlignment.Center
		caption.Font, caption.TextStrokeTransparency = Enum.Font.GothamBlack, 0.4
		item.SelectionGained:Connect(function() caption.TextColor3 = accent end)
		item.SelectionLost:Connect(function() caption.TextColor3 = cream end)
		buttons[definition[1]] = item
		local panel = Instance.new("ScrollingFrame")
		panel.Name, panel.Size = definition[1] .. "Panel", UDim2.fromOffset(400, 340)
		panel.AnchorPoint, panel.Position = Vector2.new(0.5, 0.5), UDim2.new(0.5, 0, 0.5, -34)
		panel.BackgroundColor3, panel.BorderSizePixel, panel.ScrollBarThickness = ink, 0, 4
		panel.CanvasSize, panel.Visible, panel.Parent = UDim2.fromOffset(0, 340), false, root
		panels[definition[1]] = panel
		local corner = Instance.new("UICorner")
		corner.CornerRadius, corner.Parent = UDim.new(0, 14), panel
		local title = text(panel, "Title", definition[2], 16, 34)
		title.TextSize, title.Font = 24, Enum.Font.GothamBold
		item.Activated:Connect(function() click() open(definition[1]) end)
	end
	local navOrder = {buttons.Play, buttons.Signatures, buttons.Shop, buttons.Settings}
	for index, item in navOrder do
		item.NextSelectionLeft, item.NextSelectionRight = navOrder[(index - 2) % #navOrder + 1], navOrder[index % #navOrder + 1]
	end
	local solo = button(panels.Play, "Solo", "Solo 2v2 · contra bots", 66)
	text(panels.Play, "SoloDescription", "Você e um bot contra dois bots. Começa imediatamente.", 116, 40)
	local duel = button(panels.Play, "Duel", "1v1 online · Em breve", 164)
	text(panels.Play, "DuelDescription", "Duelo entre humanos. Aquecimento até o adversário chegar.", 214, 42)
	local doubles = button(panels.Play, "Doubles", "2v2 online · Em breve", 264)
	text(panels.Play, "DoublesDescription", "Entre direto. Bots cedem suas vagas entre pontos.", 314, 42)
	panels.Play.CanvasSize = UDim2.fromOffset(0, 374)
	link({solo, duel, doubles, close})
	solo.Activated:Connect(function()
		if self.busy then return end
		click()
		if not self.catalog or not self.catalog.modes.SoloBots2v2 then
			self.message("Consultando os modos. Tente novamente em instantes.")
			return
		end
		for _, panel in panels do panel.Visible = false end
		hud.setMenu(true)
		nav.Visible, hud.panel.Visible, close.Visible = false, true, true
		link({hud.skillChoice, hud.difficultyChoice, hud.sideChoice, hud.start, close})
		focus(hud.start)
	end)
	local function online(mode: string)
		if self.catalog and self.catalog.modes[mode] and self.onMode then self.onMode(mode) end
	end
	duel.Activated:Connect(function() online("Online1v1") end)
	doubles.Activated:Connect(function() online("Online2v2") end)
	local signature = panels.Signatures
	local collectionPanel = require(script.Parent.CollectionPanel).mount(signature, button, text, function(id)
		hud.selection.ability = id
		hud.skillChoice.Text = "Assinatura · " .. Config.Abilities[id].name
	end, function() return self.reduced end)
	buttons.Signatures.Activated:Connect(function() collectionPanel.refresh() end)
	local volume = button(panels.Settings, "Volume", "Efeitos · 50%", 70)
	local reduced = button(panels.Settings, "ReducedMotion", "Animação reduzida · Desligada", 132)
	text(panels.Settings, "Scope", "Ajustes aplicados ao lobby nesta sessão.", 200, 50)
	volume.Activated:Connect(function()
		self.volume = (math.round(self.volume * 4) + 1) % 5 / 4
		volume.Text = "Efeitos · " .. math.round(self.volume * 100) .. "%"
		click()
	end)
	reduced.Activated:Connect(function()
		self.reduced = not self.reduced
		reduced.Text = "Animação reduzida · " .. (if self.reduced then "Ligada" else "Desligada")
		if tween and self.reduced then tween:Cancel() panels.Settings.BackgroundTransparency = 0.04 end
		click()
	end)
	link({volume, reduced, close})
	local shopStatus = text(panels.Shop, "Empty", "Consultando ofertas…", 70, 90)
	local shopButtons: { GuiObject } = {}
	local purchaseId: number? = nil
	local function loadCatalog()
		local ok, catalog = pcall(function() return game.ReplicatedStorage.MythicsRemotes.LobbyCatalog:InvokeServer() end)
		if not ok or not catalog or catalog.busy then
			shopStatus.Text = "Não foi possível consultar. Abra a loja para tentar novamente."
			return
		end
		self.catalog = catalog
		duel.Text = if catalog.modes.Online1v1 then "1v1 online" else "1v1 online · Em breve"
		doubles.Text = if catalog.modes.Online2v2 then "2v2 online" else "2v2 online · Em breve"
		shopStatus.Text = if #catalog.offers == 0 then "Novas ofertas em breve.\nOs giros de Assinaturas são gratuitos." else "Cosméticos para o seu cartão de jogador."
		for _, item in shopButtons do item:Destroy() end
		shopButtons = {}
		for index, offer in catalog.offers do
			local item = button(panels.Shop, "Offer" .. index,
				offer.name .. "\n" .. offer.benefit .. (if offer.owned then " · Adquirido" elseif offer.available then " · R$ " .. tostring(offer.price) else " · Indisponível"), 170 + (index - 1) * 90)
			item.Size = UDim2.new(1, -40, 0, 76)
			if offer.icon then
				local preview = Instance.new("ImageLabel")
				preview.Name, preview.Size, preview.Position = "Preview", UDim2.fromOffset(48, 48), UDim2.fromOffset(6, 14)
				preview.BackgroundTransparency, preview.Image, preview.Parent = 1, "rbxassetid://" .. offer.icon, item
				local padding = Instance.new("UIPadding")
				padding.PaddingLeft, padding.Parent = UDim.new(0, 60), item
			end
			item.Activated:Connect(function()
				if purchaseId or offer.owned or not offer.available or not offer.price then return end
				purchaseId = offer.id
				local prompted = pcall(Marketplace.PromptGamePassPurchase, Marketplace, Players.LocalPlayer, offer.id)
				if not prompted then purchaseId = nil shopStatus.Text = "Compra indisponível. Tente novamente." end
			end)
			table.insert(shopButtons, item)
		end
		panels.Shop.CanvasSize = UDim2.fromOffset(0, math.max(340, 180 + #shopButtons * 90))
		local navigation = table.clone(shopButtons)
		table.insert(navigation, close)
		link(navigation)
	end
	Marketplace.PromptGamePassPurchaseFinished:Connect(function(player, id)
		if player == Players.LocalPlayer and id == purchaseId then
			purchaseId = nil
			task.delay(2.1, loadCatalog)
		end
	end)
	buttons.Shop.Activated:Connect(function() task.spawn(loadCatalog) end)
	task.spawn(loadCatalog)
	local notice = text(root, "Notice", "", 0, 48)
	notice.AnchorPoint, notice.Position, notice.Size = Vector2.new(0.5, 1), UDim2.new(0.5, 0, 1, -116), UDim2.new(0.65, 0, 0, 44)
	notice.TextColor3 = gold
	self.message = function(value: string) notice.Text = value end
	self.setBusy = function(value: boolean)
		self.busy = value
		hud.start.Text = if value then "Entrando…" else "Jogar contra bots"
		hud.start.Active = not value
	end
	self.setVisible = function(value: boolean)
		self.visible, root.Visible = value, value
		self.setBusy(false)
		hud.score.Visible, hud.status.Visible, hud.feedback.Visible = not value, not value, not value
		if value then
			nav.Visible = true
			collectionPanel.refresh()
			notice.Text = ""
			returnTo = buttons.Play
			open(nil)
		end
	end
	self.focus = function() focus(buttons.Play) end
	game:GetService("ProximityPromptService").PromptTriggered:Connect(function(prompt, player)
		if player ~= Players.LocalPlayer or not self.visible then return end
		local name = prompt.Parent:GetAttribute("LobbyPanel")
		if panels[name] then open(name) end
	end)
	self.panelOpen = function() return selected ~= nil or hud.panel.Visible end
	Input:GetPropertyChangedSignal("PreferredInput"):Connect(function()
		if self.visible then
			hud.stick.Visible = selected == nil and not hud.panel.Visible and Input.PreferredInput == Enum.PreferredInput.Touch
			focus(if hud.panel.Visible then hud.start elseif selected then close else buttons.Play)
		end
	end)
	local function layout()
		local compact = hud.root.AbsoluteSize.Y < 500
		local width = hud.root.AbsoluteSize.X
		identity.Position = UDim2.fromOffset(20, 18)
		nav.AnchorPoint, nav.Position, nav.Size = Vector2.new(0.5, 1), UDim2.new(0.5, 0, 1, -8), UDim2.fromOffset(400, 104)
		for index, definition in names do
			local item = buttons[definition[1]]
			item.Size, item.Position = UDim2.fromOffset(88, 104), UDim2.fromOffset((index - 1) * 104, 0)
		end
		for _, panel in panels do
			panel.Size = UDim2.fromOffset(math.min(440, width - 48), math.min(360, hud.root.AbsoluteSize.Y - 146))
		end
		local modeButtons = {solo, duel, doubles}
		local descriptions = {"SoloDescription", "DuelDescription", "DoublesDescription"}
		for index, item in modeButtons do
			local description = panels.Play[descriptions[index]]
			if compact then
				item.Position, item.Size = UDim2.new((index - 1)/3, 12, 0, 58), UDim2.new(1/3, -16, 0, 54)
				item.TextSize = 12
				description.Position, description.Size, description.TextSize = UDim2.new((index - 1)/3, 12, 0, 118), UDim2.new(1/3, -16, 0, 80), 11
			else
				item.Position, item.Size, item.TextSize = UDim2.fromOffset(20, 66 + (index - 1)*100), UDim2.new(1, -40, 0, 46), 15
				description.Position, description.Size, description.TextSize = UDim2.fromOffset(20, 116 + (index - 1)*100), UDim2.new(1, -40, 0, 42), 14
			end
		end
		panels.Play.CanvasSize = UDim2.fromOffset(0, if compact then 204 else 374)
	end
	hud.root:GetPropertyChangedSignal("AbsoluteSize"):Connect(layout)
	layout()
	self.setVisible(true)
	self.focus()
	return self
end
return LobbyHud
