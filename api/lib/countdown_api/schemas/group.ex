defmodule CountdownApi.Schemas.Group do
  use Ecto.Schema
  import Ecto.Changeset

  schema "groups" do
    field :name, :string
    field :description, :string

    has_many :players, CountdownApi.Schemas.Player
    has_many :games, CountdownApi.Schemas.Game

    timestamps()
  end

  @doc false
  def changeset(group, attrs) do
    group
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end
