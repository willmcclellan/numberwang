defmodule CountdownApi.Repo.Migrations.CreateSubmissions do
  use Ecto.Migration

  def change do
    create table(:submissions) do
      add :value, :string, null: false
      add :score, :integer
      add :valid, :boolean, default: false
      add :player_id, references(:players, on_delete: :delete_all), null: false
      add :game_id, references(:games, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:submissions, [:player_id])
    create index(:submissions, [:game_id])
    create index(:submissions, [:valid])
  end
end
