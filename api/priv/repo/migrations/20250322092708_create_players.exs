defmodule CountdownApi.Repo.Migrations.CreatePlayers do
  use Ecto.Migration

  def change do
    create table(:players) do
      add :name, :string, null: false
      add :group_id, references(:groups, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:players, [:group_id])
    create unique_index(:players, [:name, :group_id])
  end
end
