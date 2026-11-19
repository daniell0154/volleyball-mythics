--!strict
local Input = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")
local Controls = {}

local function normalized(value: Vector2): Vector2
	return if value.Magnitude > 1 then value.Unit else value
end

function Controls.new(hud: any, onAction: (string) -> ())
	local self: any = { move = Vector2.zero, aim = Vector2.zero, enabled = false }
	local context = Instance.new("InputContext")
	context.Name, context.Priority, context.Sink, context.Enabled = "MythicsPlay", 2000, true, false
	context.Parent = game.Players.LocalPlayer:WaitForChild("PlayerScripts")
	self.context = context
	local function action(name: string, kind: Enum.InputActionType): InputAction
		local item = Instance.new("InputAction")
		item.Name, item.Type, item.Parent = name, kind, context
		return item
	end
	local function binding(parent: InputAction, name: string, key: Enum.KeyCode?): InputBinding
		local item = Instance.new("InputBinding")
		item.Name = name
		if key then item.KeyCode = key end
		item.Parent = parent
		return item
	end
	for _, name in { "receive", "set", "jump", "hit", "ability" } do
		local item = action(name, Enum.InputActionType.Bool)
		binding(item, "Keyboard", hud.keysByAction[name][1])
		local gamepad = binding(item, "Gamepad", hud.keysByAction[name][2])
		gamepad.PressedThreshold, gamepad.ReleasedThreshold = 0.55, 0.35
		local touch = binding(item, "Touch", nil)
		touch.UIButton = if name == "ability" then hud.ability else hud.actions[name]
		item.Pressed:Connect(function() if self.enabled then onAction(name) end end)
	end
	local move = action("Move", Enum.InputActionType.Direction2D)
	local keyboard = binding(move, "Keyboard", nil)
	keyboard.Up, keyboard.Down, keyboard.Left, keyboard.Right = Enum.KeyCode.W, Enum.KeyCode.S, Enum.KeyCode.A, Enum.KeyCode.D
	binding(move, "Gamepad", Enum.KeyCode.Thumbstick1)
	move.StateChanged:Connect(function(value) self.move = normalized(value) end)
	local aim = action("Aim", Enum.InputActionType.Direction2D)
	local arrows = binding(aim, "Keyboard", nil)
	arrows.Up, arrows.Down, arrows.Left, arrows.Right = Enum.KeyCode.Up, Enum.KeyCode.Down, Enum.KeyCode.Left, Enum.KeyCode.Right
	binding(aim, "Gamepad", Enum.KeyCode.Thumbstick2)
	aim.StateChanged:Connect(function(value)
		self.aim = if value.Magnitude > 0.15 then normalized(value) else Vector2.zero
	end)
	local clear = action("CenterAim", Enum.InputActionType.Bool)
	binding(clear, "Keyboard", Enum.KeyCode.C)
	clear.Pressed:Connect(function() self.aim = Vector2.zero end)
	local back = Instance.new("InputContext")
	back.Name, back.Priority, back.Enabled, back.Parent = "MythicsNavigation", 3000, true, context.Parent
	local backAction = Instance.new("InputAction")
	backAction.Name, backAction.Type, backAction.Parent = "Back", Enum.InputActionType.Bool, back
	binding(backAction, "Gamepad", Enum.KeyCode.ButtonB)
	backAction.Pressed:Connect(function()
		if not hud.panel.Visible and hud.onBack then hud.onBack() end
	end)
	hud.aim.Activated:Connect(function() self.aim = Vector2.zero end)
	local moveTouch: InputObject? = nil
	local aimTouch: InputObject? = nil
	local aimOrigin = Vector2.zero
	hud.stick.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch and self.enabled and not moveTouch then moveTouch = input end
	end)
	local function point(input: InputObject): Vector2 return Vector2.new(input.Position.X, input.Position.Y) end
	Input.TouchStarted:Connect(function(input, processed)
		if not self.enabled or processed or aimTouch then return end
		local objects = game.Players.LocalPlayer.PlayerGui:GetGuiObjectsAtPosition(input.Position.X, input.Position.Y)
		for _, object in objects do
			if object:IsA("GuiButton") then return end
		end
		if input.Position.X > workspace.CurrentCamera.ViewportSize.X * 0.45 then aimTouch, aimOrigin = input, point(input) end
	end)
	Input.TouchMoved:Connect(function(input)
		if input == moveTouch then
			local center = hud.stick.AbsolutePosition + hud.stick.AbsoluteSize/2
			-- AbsolutePosition and InputObject use screen pixels.
			local value = normalized((point(input)-center)/45)
			self.move = Vector2.new(value.X, -value.Y)
			hud.thumb.Position = UDim2.new(0.5, value.X*30-20, 0.5, value.Y*30-20)
		elseif input == aimTouch then
			local value = normalized((point(input)-aimOrigin)/100)
			self.aim = Vector2.new(value.X, -value.Y)
		end
	end)
	Input.TouchEnded:Connect(function(input)
		if input == moveTouch then moveTouch, self.move = nil, Vector2.zero hud.thumb.Position = UDim2.new(0.5,-20,0.5,-20) end
		if input == aimTouch then aimTouch = nil end
	end)
	local function clearInput()
		self.move, self.aim, moveTouch, aimTouch = Vector2.zero, Vector2.zero, nil, nil
		context.Enabled = false
	end
	Input.WindowFocusReleased:Connect(clearInput)
	Input.WindowFocused:Connect(function() context.Enabled = self.enabled end)
	Input.GamepadDisconnected:Connect(function() clearInput() context.Enabled = self.enabled end)
	GuiService.MenuOpened:Connect(clearInput)
	GuiService.MenuClosed:Connect(function() context.Enabled = self.enabled end)
	Input.TextBoxFocused:Connect(clearInput)
	Input.TextBoxFocusReleased:Connect(function() context.Enabled = self.enabled end)
	self.setEnabled = function(enabled: boolean)
		clearInput()
		self.enabled, context.Enabled = enabled, enabled
	end
	self.sample = function()
		local movement = if self.move.Magnitude > 0.15 then normalized(self.move) else Vector2.zero
		return movement, normalized(self.aim)
	end
	self.setAim = function(value: Vector2) self.aim = normalized(value) end
	return self
end

return Controls
