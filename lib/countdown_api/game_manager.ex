defmodule CountdownApi.GameManager do
  @moduledoc """
  Manages game creation, retrieval, and coordination with GameServer processes.
  """

  alias CountdownApi.{Repo, GameServer}
  alias CountdownApi.Schemas.{Game}
  import Ecto.Query

  @doc """
  Create a new letters game.
  """
  def create_letters_game(group_id, duration \\ 30) do
    # Generate random letters with a good mix of vowels and consonants
    letters = generate_letters()

    attrs = %{
      group_id: group_id,
      game_type: "letters",
      duration: duration,
      letters: letters
    }

    create_game(attrs)
  end

  @doc """
  Create a new conundrum game.
  """
  def create_conundrum_game(group_id, duration \\ 30) do
    # Generate 9 letters that can form at least one valid word
    letters = generate_conundrum_letters()

    attrs = %{
      group_id: group_id,
      game_type: "conundrum",
      duration: duration,
      letters: letters
    }

    create_game(attrs)
  end

  @doc """
  Create a new numbers game.
  """
  def create_numbers_game(group_id, large_count \\ 2, duration \\ 30) do
    {numbers, target} = generate_numbers(large_count)

    attrs = %{
      group_id: group_id,
      game_type: "numbers",
      duration: duration,
      numbers: numbers,
      target: target,
      large_number_count: large_count
    }

    create_game(attrs)
  end

  @doc """
  Submit a value to a running game.
  """
  def submit_value(game_id, player_id, value) do
    # Ensure game server is running
    case ensure_game_server(game_id) do
      {:ok, _pid} -> GameServer.submit(game_id, player_id, value)
      {:error, _} = error -> error
    end
  end

  @doc """
  Get the current state of a game.
  """
  def get_game_state(game_id) do
    case ensure_game_server(game_id) do
      {:ok, _pid} -> GameServer.get_state(game_id)
      {:error, _} = error -> error
    end
  end

  @doc """
  End a game before its normal timeout.
  """
  def end_game(game_id) do
    case ensure_game_server(game_id) do
      {:ok, _pid} -> GameServer.end_game(game_id)
      {:error, _} = error -> error
    end
  end

  @doc """
  Get game results (available words, solutions, etc.)
  """
  def get_game_results(game_id) do
    case ensure_game_server(game_id) do
      {:ok, _pid} -> GameServer.get_results(game_id)
      {:error, _} = error -> error
    end
  end

  @doc """
  List all games for a group.
  """
  def list_group_games(group_id) do
    Repo.all(
      from g in Game,
        where: g.group_id == ^group_id,
        order_by: [desc: g.inserted_at],
        preload: [:submissions]
    )
  end

  @doc """
  Get a specific game.
  """
  def get_game(game_id) do
    Repo.get(Game, game_id) |> Repo.preload([:submissions])
  end

  # Private functions

  defp create_game(attrs) do
    %Game{}
    |> Game.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, game} ->
        # Start the game server for this game
        start_game_server(game.id)
        {:ok, game}

      error ->
        error
    end
  end

  defp ensure_game_server(game_id) do
    case Registry.lookup(CountdownApi.GameRegistry, game_id) do
      [{pid, _}] -> {:ok, pid}
      [] -> start_game_server(game_id)
    end
  end

  defp start_game_server(game_id) do
    case DynamicSupervisor.start_child(
           CountdownApi.GameSupervisor,
           {GameServer, game_id}
         ) do
      {:ok, pid} -> {:ok, pid}
      {:error, {:already_started, pid}} -> {:ok, pid}
      error -> error
    end
  end

  # Letter generation for letters games
  defp generate_letters do
    vowels = ["A", "E", "I", "O", "U"]

    consonants = [
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L",
      "M",
      "N",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "V",
      "W",
      "X",
      "Y",
      "Z"
    ]

    # Get 3-5 vowels
    vowel_count = Enum.random(3..5)
    selected_vowels = Enum.take_random(vowels, vowel_count)

    # Get 4-6 consonants
    consonant_count = 9 - vowel_count
    selected_consonants = Enum.take_random(consonants, consonant_count)

    # Mix them together
    (selected_vowels ++ selected_consonants)
    |> Enum.shuffle()
  end

  # TODO implement this
  # Generate letters that form at least one valid word for conundrum
  defp generate_conundrum_letters do
    # For now, just use a fixed set that we know forms words
    # In a real app, you'd have a more sophisticated algorithm
    ["S", "C", "R", "A", "M", "B", "L", "E", "D"] |> Enum.shuffle()
  end

  # Generate numbers and a target for numbers games
  defp generate_numbers(large_count) do
    large_numbers = [25, 50, 75, 100]
    small_numbers = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]

    # Ensure large_count is valid
    large_count = min(4, max(0, large_count))

    # Get random large numbers
    selected_large = Enum.take_random(large_numbers, large_count)

    # Get random small numbers
    small_count = 6 - large_count
    selected_small = Enum.take_random(small_numbers, small_count)

    # Combine and shuffle
    numbers = (selected_large ++ selected_small) |> Enum.shuffle()

    # Generate a target between 100 and 999
    target = Enum.random(100..999)

    {numbers, target}
  end
end
