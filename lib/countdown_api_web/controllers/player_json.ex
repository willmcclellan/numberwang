defmodule CountdownApiWeb.PlayerJSON do
  alias CountdownApi.Schemas.Player
  
  def index(%{players: players}) do
    %{data: for(player <- players, do: data(player))}
  end
  
  def show(%{player: player}) do
    %{data: data(player)}
  end
  
  defp data(%Player{} = player) do
    %{
      id: player.id,
      name: player.name,
      group_id: player.group_id
    }
  end
end
