defmodule CountdownApiWeb.GameController do
  use CountdownApiWeb, :controller
  
  alias CountdownApi.GameManager
  
  def index(conn, %{"group_id" => group_id}) do
    games = GameManager.list_group_games(group_id)
    render(conn, :index, games: games)
  end
  
  def show(conn, %{"id" => id}) do
    case GameManager.get_game(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Game not found"})
      
      game ->
        render(conn, :show, game: game)
    end
  end
end
