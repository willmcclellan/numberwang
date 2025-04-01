defmodule CountdownApi.Repo.Migrations.RemoveUniqueGameTypeConstraint do
  use Ecto.Migration

  def up do
    drop index(:games, [:game_type])
    create index(:games, [:game_type])
  end

  def down do
    drop index(:games, [:game_type])
    create unique_index(:games, [:game_type])
  end
end
