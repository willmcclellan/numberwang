defmodule CountdownApiWeb.GroupController do
  use CountdownApiWeb, :controller
  
  alias CountdownApi.Groups
  
  def index(conn, _params) do
    groups = Groups.list_groups()
    render(conn, :index, groups: groups)
  end
  
  def show(conn, %{"id" => id}) do
    case Groups.get_group(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Group not found"})
      
      group ->
        render(conn, :show, group: group)
    end
  end
  
  def create(conn, %{"group" => group_params}) do
    with {:ok, group} <- Groups.create_group(group_params) do
      conn
      |> put_status(:created)
      |> render(:show, group: group)
    end
  end
end
