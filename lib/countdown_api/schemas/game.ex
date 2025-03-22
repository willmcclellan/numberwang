defmodule CountdownApi.Schemas.Game do
  use Ecto.Schema
  import Ecto.Changeset

  @game_types ["letters", "numbers", "conundrum"]
  @durations [30, 45, 60]

  schema "games" do
    field :game_type, :string
    field :duration, :integer, default: 30
    field :letters, {:array, :string}
    field :numbers, {:array, :integer}
    field :target, :integer
    field :started_at, :utc_datetime
    field :finished_at, :utc_datetime
    field :large_number_count, :integer

    belongs_to :group, CountdownApi.Schemas.Group
    has_many :submissions, CountdownApi.Schemas.Submission

    timestamps()
  end

  @doc false
  def changeset(game, attrs) do
    game
    |> cast(attrs, [:game_type, :duration, :letters, :numbers, :target, :started_at, :finished_at, :large_number_count, :group_id])
    |> validate_required([:game_type, :duration, :group_id])
    |> validate_inclusion(:game_type, @game_types)
    |> validate_inclusion(:duration, @durations)
    |> validate_number(:target, greater_than_or_equal_to: 0, less_than_or_equal_to: 4)
    |> validate_game_type_data()
    |> foreign_key_constraint(:group_id)
  end

  defp validate_game_type_data(changeset) do
    game_type = get_field(changeset, :game_type)

    case game_type do
      "letters" ->
        changeset
        |> validate_required([:letters])
        |> validate_length(:letters, is: 9)

      "numbers" ->
        changeset
        |> validate_required([:numbers, :target, :large_number_count])
        |> validate_length(:numbers, is: 6)

      "conundrum" ->
        changeset
        |> validate_required([:letters])
        |> validate_length(:letters, is: 9)
    end
  end
end
