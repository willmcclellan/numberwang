defmodule CountdownApi.Schemas.Player do
  use Ecto.Schema
  import Ecto.Changeset

  schema "players" do
    field :name, :string

    belongs_to :group, CountdownApi.Schemas.Group
    has_many :submissions, CountdownApi.Schemas.Submission

    timestamps()
  end

  @doc false
  def changeset(player, attrs) do
    player
    |> cast(attrs, [:name, :group_id])
    |> validate_required([:name, :group_id])
    |> foreign_key_constraint(:group_id)
  end
end
