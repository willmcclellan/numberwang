defmodule CountdownApi.Schemas.Submission do
  use Ecto.Schema
  import Ecto.Changeset

  schema "submissions" do
    field :value, :string
    field :score, :integer
    field :valid, :boolean, default: false

    belongs_to :player, CountdownApi.Schemas.Player
    belongs_to :game, CountdownApi.Schemas.Game

    timestamps()
  end

  @doc false
  def changeset(submission, attrs) do
    submission
    |> cast(attrs, [:value, :score, :valid, :player_id, :game_id])
    |> validate_required([:value, :player_id, :game_id])
    |> foreign_key_constraint(:player_id)
    |> foreign_key_constraint(:game_id)
  end
end
