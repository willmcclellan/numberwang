defmodule CountdownApiWeb.PlayerController do
  use CountdownApiWeb, :controller
  
  alias CountdownApi.Groups
  
  def index(conn, %{"group_id" => group_id}) do
    players = Groups.list_group_players(group_id)
    render(conn, :index, players: players)
  end
  
  def show(conn, %{"id" => id}) do
    case Groups.get_player(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Player not found"})
      
      player ->
        render(conn, :show, player: player)
    end
  end
  
  def create(conn, %{"group_id" => group_id, "player" => player_params}) do
    player_params = Map.put(player_params, "group_id", group_id)
    
    with {:ok, player} <- Groups.create_player(player_params) do
      conn
      |> put_status(:created)
      |> render(:show, player: player)
    end
  end
end
