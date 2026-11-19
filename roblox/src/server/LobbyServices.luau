--!strict
local Marketplace = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local LobbyServices = {}
-- Add owned game-pass IDs here after the launch catalog is defined.
local offers: { { id: number, benefit: string, color: Color3 } } = {}

function LobbyServices.start(folder: Folder)
	local request = Instance.new("RemoteFunction")
	request.Name, request.Parent = "LobbyCatalog", folder
	local pending: { [Player]: boolean } = {}
	local last: { [Player]: number } = {}
	local function verify(player: Player, offer: any): boolean
		local ok, owned = pcall(Marketplace.UserOwnsGamePassAsync, Marketplace, player.UserId, offer.id)
		if ok and owned then
			player:SetAttribute("CardFrame", offer.id)
			player:SetAttribute("CardFrameColor", offer.color)
		end
		return ok and owned
	end
	request.OnServerInvoke = function(player: Player)
		if pending[player] or os.clock() - (last[player] or -10) < 2 then return { busy = true } end
		pending[player], last[player] = true, os.clock()
		local items = {}
		for _, offer in offers do
			local ok, info = pcall(Marketplace.GetProductInfoAsync, Marketplace, offer.id, Enum.InfoType.GamePass)
			table.insert(items, {
				id = offer.id, name = if ok then info.Name else "Oferta indisponível",
				price = if ok then info.PriceInRobux else nil,
				icon = if ok then info.IconImageAssetId else nil,
				available = ok and info.IsForSale == true, benefit = offer.benefit,
				owned = verify(player, offer),
			})
		end
		pending[player] = nil
		return { modes = { SoloBots2v2 = true, Online1v1 = true, Online2v2 = true }, offers = items }
	end
	Marketplace.PromptGamePassPurchaseFinished:Connect(function(player, id, purchased)
		if not purchased then return end
		for _, offer in offers do if offer.id == id then verify(player, offer) end end
	end)
	Players.PlayerRemoving:Connect(function(player) pending[player], last[player] = nil, nil end)
end
return LobbyServices
