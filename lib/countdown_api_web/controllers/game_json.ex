defmodule CountdownApiWeb.GameJSON do
  alias CountdownApi.Schemas.Game
  
  def index(%{games: games}) do
    %{data: for(game <- games, do: data(game))}
  end
  
  def show(%{game: game}) do
    %{data: data(game)}
  end
  
  defp data(%Game{} = game) do
    %{
      id: game.id,
      game_type: game.game_type,
      duration: game.duration,
      letters: game.letters,
      numbers: game.numbers,
      target: game.target,
      started_at: game.started_at,
      finished_at: game.finished_at,
      group_id: game.group_id,
      large_number_count: game.large_number_count,
      submissions: Enum.map(game.submissions || [], fn submission ->
        %{
          id: submission.id,
          player_id: submission.player_id,
          value: submission.value,
          score: submission.score,
          valid: submission.valid
        }
      end)
    }
  end
end
