--!strict
local Players = game:GetService("Players")
local Input = game:GetService("UserInputService")
local LobbyControls = {}

function LobbyControls.new(hud: any)
	local self: any = { enabled = true, yaw = 0, pitch = 0.3 }
	local context = Instance.new("InputContext")
	context.Name, context.Priority, context.Sink, context.Parent = "MythicsExplore", 1500, true, Players.LocalPlayer.PlayerScripts
	local function direction(name: string, stick: Enum.KeyCode): InputAction
		local action = Instance.new("InputAction")
		action.Name, action.Type, action.Parent = name, Enum.InputActionType.Direction2D, context
		local binding = Instance.new("InputBinding")
		binding.KeyCode, binding.Parent = stick, action
		return action
	end
	local move = direction("Walk", Enum.KeyCode.Thumbstick1)
	local keyboard = Instance.new("InputBinding")
	keyboard.Up, keyboard.Down, keyboard.Left, keyboard.Right = Enum.KeyCode.W, Enum.KeyCode.S, Enum.KeyCode.A, Enum.KeyCode.D
	keyboard.Parent = move
	local look = direction("Look", Enum.KeyCode.Thumbstick2)
	local walking, looking = Vector2.zero, Vector2.zero
	move.StateChanged:Connect(function(value) walking = value end)
	look.StateChanged:Connect(function(value) looking = value end)
	local touch: InputObject? = nil
	local origin = Vector2.zero
	local drag = Vector2.zero
	hud.stick.InputBegan:Connect(function(input)
		if self.enabled and input.UserInputType == Enum.UserInputType.Touch and not touch then
			touch, origin = input, Vector2.new(input.Position.X, input.Position.Y)
		end
	end)
	Input.TouchStarted:Connect(function(input, processed)
		if self.enabled and not processed and not touch then
			touch, origin = input, Vector2.new(input.Position.X, input.Position.Y)
		end
	end)
	Input.TouchMoved:Connect(function(input)
		if input == touch then drag = (Vector2.new(input.Position.X, input.Position.Y) - origin) / 80 end
	end)
	Input.TouchEnded:Connect(function(input) if input == touch then touch, drag = nil, Vector2.zero end end)
	Input.InputChanged:Connect(function(input)
		if self.enabled and input.UserInputType == Enum.UserInputType.MouseMovement and Input:IsMouseButtonPressed(Enum.UserInputType.MouseButton2) then
			self.yaw -= input.Delta.X * 0.006
			self.pitch = math.clamp(self.pitch + input.Delta.Y * 0.004, 0.1, 0.9)
		end
	end)
	local function clear()
		walking, looking, touch, drag = Vector2.zero, Vector2.zero, nil, Vector2.zero
		local character = Players.LocalPlayer.Character
		local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
		if humanoid then humanoid:Move(Vector3.zero) end
	end
	Input.WindowFocusReleased:Connect(clear)
	game:GetService("GuiService").MenuOpened:Connect(clear)
	self.Enable = function() self.enabled, context.Enabled = true, true clear() end
	self.Disable = function() self.enabled, context.Enabled = false, false clear() end
	self.step = function(dt: number, blocked: boolean)
		if not self.enabled then return end
		local character = Players.LocalPlayer.Character
		local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
		local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
		if not humanoid or not root or not root:IsA("BasePart") then return end
		self.yaw -= looking.X * dt * 2
		self.pitch = math.clamp(self.pitch + looking.Y * dt, 0.1, 0.9)
		local camera = workspace.CurrentCamera
		local rotation = CFrame.Angles(0, self.yaw, 0)
		local value = if blocked then Vector2.zero elseif touch then Vector2.new(drag.X, -drag.Y) else walking
		if value.Magnitude > 1 then value = value.Unit end
		humanoid:Move(rotation:VectorToWorldSpace(Vector3.new(value.X, 0, -value.Y)))
		camera.CameraType = Enum.CameraType.Scriptable
		local target = root.Position + Vector3.new(0, 2, 0)
		camera.CFrame = CFrame.lookAt(target + rotation:VectorToWorldSpace(Vector3.new(0, 5 + self.pitch * 8, 18)), target + Vector3.new(0, 0, -5))
	end
	return self
end
return LobbyControls
