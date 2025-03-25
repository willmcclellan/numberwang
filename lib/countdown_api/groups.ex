defmodule CountdownApi.Groups do
  @moduledoc """
  Context module for handling group and player management.
  """
  
  import Ecto.Query
  alias CountdownApi.Repo
  alias CountdownApi.Schemas.{Group, Player}
  
  @doc """
  Creates a new group.
  """
  def create_group(attrs \\ %{}) do
    %Group{}
    |> Group.changeset(attrs)
    |> Repo.insert()
  end
  
  @doc """
  Gets a group by name.
  """
  def get_group_by_name(name) do
    Repo.one(from g in Group, where: g.name == ^name)
  end
  
  @doc """
  Gets a group by ID.
  """
  def get_group(id) do
    Repo.get(Group, id)
  end
  
  @doc """
  Lists all groups.
  """
  def list_groups do
    Repo.all(Group)
  end
  
  @doc """
  Updates a group.
  """
  def update_group(%Group{} = group, attrs) do
    group
    |> Group.changeset(attrs)
    |> Repo.update()
  end
  
  @doc """
  Deletes a group.
  """
  def delete_group(%Group{} = group) do
    Repo.delete(group)
  end
  
  @doc """
  Creates a player within a group.
  """
  def create_player(attrs \\ %{}) do
    %Player{}
    |> Player.changeset(attrs)
    |> Repo.insert()
  end
  
  @doc """
  Gets an existing player or creates a new one if not found.
  """
  def get_or_create_player(name, group_id) do
    case get_player_by_name(name, group_id) do
      nil -> create_player(%{name: name, group_id: group_id})
      player -> {:ok, player}
    end
  end
  
  @doc """
  Gets a player by name and group ID.
  """
  def get_player_by_name(name, group_id) do
    Repo.one(from p in Player, where: p.name == ^name and p.group_id == ^group_id)
  end
  
  @doc """
  Gets a player by ID.
  """
  def get_player(id) do
    Repo.get(Player, id)
  end
  
  @doc """
  Lists all players in a group.
  """
  def list_group_players(group_id) do
    Repo.all(from p in Player, where: p.group_id == ^group_id)
  end
  
  @doc """
  Updates a player.
  """
  def update_player(%Player{} = player, attrs) do
    player
    |> Player.changeset(attrs)
    |> Repo.update()
  end
  
  @doc """
  Deletes a player.
  """
  def delete_player(%Player{} = player) do
    Repo.delete(player)
  end
end
