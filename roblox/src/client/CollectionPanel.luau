--!strict
local Http = game:GetService("HttpService")
local CollectionPanel = {}

function CollectionPanel.mount(panel: ScrollingFrame, button: any, text: any, onEquipped: (string) -> (), reduced: () -> boolean)
	local remote = game.ReplicatedStorage.MythicsRemotes:WaitForChild("Collection") :: RemoteFunction
	local self: any = { profile = nil, pending = nil, busy = false }
	local equipped = text(panel, "Equipped", "Carregando coleção…", 62, 46)
	local status = text(panel, "Result", "", 114, 44)
	local balance = text(panel, "Balance", "", 160, 26)
	local spin = button(panel, "Spin", "Girar assinatura", 196)
	local retry = button(panel, "Retry", "Atualizar / tentar novamente", 250)
	local cards = {}
	local messages = { unavailable = "Falha ao salvar. Tente novamente para consultar a mesma operação.",
		stale = "Sua coleção mudou. Confira os dados e tente novamente.",
		no_spins = "Você precisa de um giro. Conclua uma partida por pontos.",
		complete = "Você já tem todas. Seu saldo foi preservado.", not_owned = "Habilidade indisponível para equipar.",
		busy = "Aguarde a operação em andamento." }
	local request: any
	local function render()
		local p = self.profile
		if not p then return end
		local gui = game:GetService("GuiService")
		if gui.SelectedObject and gui.SelectedObject:IsDescendantOf(panel) then self.selectionName = gui.SelectedObject.Name end
		local byId = {}
		for _, item in p.catalog do byId[item.id] = item end
		equipped.Text = "Em uso · " .. (if byId[p.equipped] then byId[p.equipped].name else p.equipped)
		balance.Text = p.spins .. " giro(s)" .. (if self.temporary then " · Perfil temporário no Studio" else "")
		spin.Text = if self.busy then "Aguardando confirmação…" elseif p.complete then "Coleção completa" else "Girar assinatura"
		spin.Active = not self.busy and not p.complete
		for _, card in cards do card:Destroy() end
		cards = {}
		local index = 0
		for _, item in p.catalog do
			if not item.enabled then continue end
			local owned = p.owned[item.id] == true
			local chance = p.chances[item.id]
			local subtitle = if owned then (if p.equipped == item.id then "Equipada" else "Equipar") elseif chance then string.format("%.1f%%", chance*100) else "Inicial"
			local card = button(panel, "Signature_" .. item.id,
				item.name .. " · " .. subtitle .. "\n" .. item.effect .. "\n" .. item.cooldown .. "s de recarga" .. (if item.doublesOnly then " · Duplas" else " · Todos os modos") .. (if item.development then " · Teste" else ""), 314 + index*112)
			card.Size, card.TextSize = UDim2.new(1, -40, 0, 100), 13
			card.Active = owned and not self.busy and p.equipped ~= item.id
			card.Activated:Connect(function()
				if owned and not self.busy then request("equip", item.id) end
			end)
			table.insert(cards, card)
			index += 1
		end
		local navigation = {spin, retry}
		for _, card in cards do table.insert(navigation, card) end
		for i, item in navigation do
			item.NextSelectionDown, item.NextSelectionUp = navigation[i % #navigation + 1], navigation[(i-2) % #navigation + 1]
		end
		panel.CanvasSize = UDim2.fromOffset(0, 326 + index*112)
		if self.selectionName and panel.Visible and game:GetService("UserInputService").PreferredInput == Enum.PreferredInput.Gamepad then
			local target = panel:FindFirstChild(self.selectionName)
			if target and target:IsA("GuiButton") then task.defer(function() if target.Parent then gui.SelectedObject = target end end) end
		end
		onEquipped(p.equipped)
	end
	request = function(kind: string?, ability: string?)
		if self.busy then return end
		if kind and not self.profile then return end
		self.busy = true
		if kind and not self.pending then
			self.pending = { id = Http:GenerateGUID(false), kind = kind, ability = ability,
				seq = self.profile.sequence + 1, revision = self.profile.revision }
		end
		render()
		status.Text = if self.pending and self.pending.kind == "spin" then "Consultando o resultado do giro…" else "Atualizando coleção…"
		task.spawn(function()
			local ok, result = pcall(function() return remote:InvokeServer(self.pending) end)
			self.busy = false
			if not ok or not result or result.error then
				status.Text = messages[if result then result.error else "unavailable"] or messages.unavailable
				render()
				return
			end
			self.profile, self.temporary = result.profile, result.temporary
			self.pending = nil
			if result.receipt and result.receipt.ability then
				local name = result.receipt.ability
				for _, item in result.profile.catalog do if item.id == name then name = item.name break end end
				status.Text = "Você ganhou " .. name
				if not reduced() then
					status.TextTransparency = 0.6
					game:GetService("TweenService"):Create(status, TweenInfo.new(0.25), {TextTransparency = 0}):Play()
				end
			else status.Text = messages[result.status] or "Coleção atualizada" end
			render()
		end)
	end
	spin.Activated:Connect(function() if spin.Active then request("spin") end end)
	retry.Activated:Connect(function() request(nil) end)
	self.refresh = function() request(nil) end
	self.refresh()
	return self
end
return CollectionPanel
