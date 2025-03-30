defmodule CountdownApiWeb.GroupJSON do
  alias CountdownApi.Schemas.Group

  def index(%{groups: groups}) do
    %{data: for(group <- groups, do: data(group))}
  end

  def show(%{group: group}) do
    %{data: data(group)}
  end

  defp data(%Group{} = group) do
    %{
      id: group.id,
      name: group.name,
      description: group.description
    }
  end
end
