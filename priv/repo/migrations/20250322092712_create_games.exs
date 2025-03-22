defmodule CountdownApi.Repo.Migrations.CreateGames do
  use Ecto.Migration

  def change do
    create table(:games) do
      add :game_type, :string, null: false
      add :duration, :integer, null: false
      add :letters, {:array, :string}
      add :numbers, {:array, :integer}
      add :target, :integer
      add :started_at, :utc_datetime
      add :finished_at, :utc_datetime
      add :large_number_count, :integer
      add :group_id, references(:groups, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:games, [:group_id])
    create unique_index(:games, [:game_type])

  end
end
