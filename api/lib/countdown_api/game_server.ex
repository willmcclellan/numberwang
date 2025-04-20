defmodule CountdownApi.GameServer do
  @moduledoc """
  Manages the state and logic for a single game instance.
  """
  use GenServer, restart: :temporary

  alias CountdownApi.{Repo, Dictionary}
  alias CountdownApi.Schemas.{Game, Submission}
  alias Phoenix.PubSub
  import Ecto.Query
  require Logger

  @pubsub CountdownApi.PubSub
  # 5 minutes timeout for inactive games
  @timeout 60_000 * 15
  @timeout_multiplier if Mix.env() == :test, do: 0.1, else: 1

  # Client API

  def start_link(game_id) do
    GenServer.start_link(__MODULE__, game_id, name: via_tuple(game_id))
  end

  def start_game(game_id, options) do
    GenServer.call(via_tuple(game_id), {:start_game, options})
  end

  def submit(game_id, player_id, value) do
    GenServer.call(via_tuple(game_id), {:submit, player_id, value})
  end

  def get_state(game_id) do
    GenServer.call(via_tuple(game_id), :get_state)
  end

  def end_game(game_id) do
    GenServer.call(via_tuple(game_id), :end_game)
  end

  def get_results(game_id) do
    GenServer.call(via_tuple(game_id), :get_results)
  end

  # Server callbacks

  @impl true
  def init(game_id) do
    game = Repo.get!(Game, game_id) |> Repo.preload([:group])

    # Broadcast game created
    broadcast(game, "game_created", %{game: game_to_map(game)})

    {:ok, %{game: game, submissions: []}, @timeout}
  end

  def handle_call(:game_status, _from, state = %{game_ended: true}) do
    {:reply, {:game_ended, state}, state}
  end

  def handle_call(:game_status, _from, state) do
    {:reply, {:game_active, state}, state}
  end

  @impl true
  # start letters game
  def handle_call(
    {:start_game, %{"letters" => letters, "duration" => duration}}, 
    _from, %{game: game, } = state
  ) do
    # Update game with start time
    {:ok, game} = update_game(game, %{letters: letters, duration: duration, started_at: DateTime.utc_now()})


    # Schedule game end
    # NOTE multiplier used to help tests run faster
    game_duration = trunc(game.duration * 1000 * @timeout_multiplier)
    IO.puts("Scheduling game end in #{game_duration}ms")
    Process.send_after(self(), :end_game, game_duration)

    # Broadcast game start
    IO.puts("Broadcasting game started for game name #{game.group.name}")
    broadcast(game, "game_started", %{game: game_to_map(game)})

    {:reply, { :ok }, %{state | game: game}, @timeout}
  end

  @impl true
  def handle_call(
        {:submit, player_id, value},
        _from,
        %{game: game, submissions: submissions} = state
      ) do
    # Create submission
    attrs = %{
      game_id: game.id,
      player_id: player_id,
      value: value,
      # Initial validation, will be updated at game end
      valid: validate_word_letters(game, value) and initial_validation(game, value),
      score: calculate_score(game, value)
    }

    case Repo.insert(Submission.changeset(%Submission{}, attrs)) do
      {:ok, submission} ->
        # Broadcast submission to all players
        broadcast(game, "new_submission", %{
          player_id: player_id,
          value: value,
          valid: submission.valid,
          score: submission.score
        })

        {:reply, {:ok, submission}, %{state | submissions: [submission | submissions]}, @timeout}

      {:error, changeset} ->
        {:reply, {:error, changeset}, state, @timeout}
    end
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, {:ok, state}, state, @timeout}
  end

  @impl true
  def handle_call(:end_game, _from, state) do
    # Timeout of 0 will stop the process after reply
    # TODO come back here an increase this if I want to add latest answer support
    {:reply, :ok, state, @timeout}
  end

  @impl true
  def handle_call(:get_results, _from, %{game: game} = state) do
    try do
      results = get_game_results(game)
      {:reply, {:ok, results}, state, @timeout}
    rescue
      error in FunctionClauseError ->
        # Handle missing game data
        reason = "Missing required game data: #{inspect(error)}"
        Logger.error("Error getting results: #{reason}")
        {:reply, {:error, reason}, state, @timeout}

      error in ArgumentError ->
        # Handle invalid arguments
        reason = "Invalid argument: #{error.message}"
        Logger.error("Error getting results: #{reason}")
        {:reply, {:error, reason}, state, @timeout}

      error ->
        # Handle any other unexpected errors
        reason = "Unexpected error: #{inspect(error)}"
        Logger.error("Error getting results: #{reason}\n#{Exception.format_stacktrace()}")
        {:reply, {:error, reason}, state, @timeout}
    end
  end

  @impl true
  def handle_info(:end_game, %{game: game, submissions: _submissions} = state) do
    game = Repo.get!(Game, game.id)
    # Update game with end time
    {:ok, game} = update_game(game, %{finished_at: DateTime.utc_now()})


    # Validate all submissions and update them
    # validate_all_submissions(game, submissions)

    # Broadcast game end
    broadcast(game, "game_ended", %{
      game_id: game.id,
      results: get_game_results(game)
    })

    IO.puts("Game ended. Updating server state...")

    new_state = Map.put(state, :game_ended, true)
    {:noreply, new_state}
  end

  @impl true
  def terminate(reason, _state) do
    IO.puts("Game server for game terminating. Reason: #{inspect(reason)}")
    :ok
  end

  # Private functions

  defp via_tuple(game_id) do
    {:via, Registry, {CountdownApi.GameRegistry, game_id}}
  end

  defp update_game(game, attrs) do
    IO.puts("Updating game with attrs: #{inspect(attrs)}")
    game
    |> Game.changeset(attrs)
    |> Repo.update()
  end

  defp broadcast(game, event, payload) do
    topic = "group:#{game.group.name}"
    IO.puts("Broadcasting to topic: #{topic} with event: #{event} and payload: #{inspect(payload)}")
    PubSub.broadcast(@pubsub, topic, %Phoenix.Socket.Broadcast{
      topic: topic,
      event: event,
      payload: payload
    })
  end

  # Basic validation during gameplay - will be refined at game end
  defp initial_validation(game, value) do
    case game.game_type do
      "letters" -> Dictionary.valid_word?(value)
      "conundrum" -> Dictionary.valid_word?(value)
      "numbers" -> validate_number_expression(value, game.target)
      _ -> false
    end
  end

  defp validate_word_letters(game, value) do
    IO.puts("Validating word letters for game: #{inspect(game)}, value: #{inspect(value)}")
    game_letters = Enum.map(game.letters, &String.downcase/1)
    word_letters = String.graphemes(value) |> Enum.map(&String.downcase/1)

    IO.puts("Game letters: #{inspect(game_letters)}, Word letters: #{inspect(word_letters)}")
    if game_letters == nil do
      {:error, "Game has no letters"}
    else
      Enum.all?(word_letters, fn letter ->
        Enum.count(word_letters, &(&1 == letter)) <= Enum.count(game_letters, &(&1 == letter))
      end)
    end
  end

  # Calculate scoring
  defp calculate_score(game, value) do
    case game.game_type do
      "letters" ->
        if Dictionary.valid_word?(value), do: String.length(value), else: 0

      "conundrum" ->
        if Dictionary.valid_word?(value), do: 10, else: 0

      "numbers" ->
        case evaluate_expression(value) do
          {:ok, result} ->
            diff = abs(game.target - result)

            cond do
              diff == 0 -> 10
              diff <= 5 -> 7
              diff <= 10 -> 5
              true -> 0
            end

          _ ->
            0
        end
    end
  end

  # TODO do we need this?
  # Final validation at game end
  # defp validate_all_submissions(_game, submissions) do
  #   # Implement more thorough validation if needed
  #   # For example, checking that letters are actually available in the game
  #   Enum.each(submissions, fn submission ->
  #     Repo.update(Submission.changeset(submission, %{}))
  #   end)
  # end

  # Get final game results
  defp get_game_results(game) do
    submissions = Repo.all(from s in Submission, where: s.game_id == ^game.id, preload: [:player])

    winner =
      submissions
      |> Enum.filter(& &1.valid)
      |> Enum.sort_by(& &1.score, :desc)
      |> List.first()

    results =
      case game.game_type do
        "letters" ->
          all_words = Dictionary.find_words(game.letters)
          IO.puts("All words: #{inspect(length(all_words))}")
          %{
            word_distribution: Dictionary.word_length_distribution(game.letters),
            all_words: Dictionary.find_words(game.letters)
          }
        "conundrum" ->
          %{
            all_words: Dictionary.find_words(game.letters)
          }
        "numbers" ->
          solutions = find_number_solutions(game.numbers, game.target)
          %{
            possible: length(solutions) > 0,
            solutions: solutions
          }
        unknown_type ->
          # Handle unknown game type
          {:error, "Unknown game type: #{unknown_type}"}
      end

    %{
      game_id: game.id,
      game_type: game.game_type,
      results: results,
      winner:
        winner &&
          %{
            player_id: winner.player_id,
            player_name: winner.player.name,
            value: winner.value,
            score: winner.score
          },
      submissions:
        submissions
        |> Enum.map(fn s ->
          %{
            player_id: s.player_id,
            player_name: s.player.name,
            value: s.value,
            valid: s.valid,
            score: s.score
          }
        end)
    }
  end

  # Convert Game struct to map for JSON serialization
  defp game_to_map(game) do
    %{
      id: game.id,
      game_type: game.game_type,
      duration: game.duration,
      letters: game.letters,
      numbers: game.numbers,
      target: game.target,
      started_at: game.started_at,
      group_id: game.group_id
    }
  end

  # Numbers game evaluation logic
  defp validate_number_expression(expression, target) do
    case evaluate_expression(expression) do
      {:ok, ^target} -> true
      _ -> false
    end
  end

  defp evaluate_expression(expression) do
    # Simple expression evaluator - in production you'd want a more robust parser
    try do
      # TODO: Implement proper expression parsing
      # WARNING: This is for demonstration - using Code.eval_string in production
      # can be dangerous. Use a proper safe expression evaluator in real apps.
      {result, _} = Code.eval_string(expression)
      {:ok, result}
    rescue
      _ -> {:error, :invalid_expression}
    end
  end

  # Find all possible solutions for the numbers game
  # This is a simplified implementation - you'd want a more efficient algorithm in production
  defp find_number_solutions(numbers, _target) do
    # TODO implement this
    # For demonstration, we'll just return a dummy solution
    # In a real implementation, you'd use a recursive algorithm to find all valid solutions
    [
      "#{Enum.at(numbers, 0)} + #{Enum.at(numbers, 1)} * #{Enum.at(numbers, 2)} - #{Enum.at(numbers, 3)}"
    ]
  end
end
