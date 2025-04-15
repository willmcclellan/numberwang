defmodule CountdownApiWeb.GroupChannel do
  use Phoenix.Channel

  alias CountdownApi.{Groups, GameManager}

  @doc """
  Join a group channel. This is the main communication channel for a group of players.
  """
  def join("group:" <> group_name, %{"player_name" => player_name}, socket) do
    try do
      # Find or create the group
      group = case Groups.get_group_by_name(group_name) do
        nil -> 
          case Groups.create_group(%{name: group_name}) do
            {:ok, group} -> 
              group
            {:error, changeset} -> 
              IO.puts("Error creating group: #{inspect(changeset)}")
              raise "Failed to create group: #{inspect(changeset)}"
          end
        group -> 
          group
      end

      if group do
        # Find or create the player in this group
        case Groups.get_or_create_player(player_name, group.id) do
          {:ok, player} ->
            socket = socket
              |> assign(:group_id, group.id)
              |> assign(:player_id, player.id)
              |> assign(:player_name, player.name)

            # Send current players to the new joiner
            send(self(), :after_join)

            {:ok, %{
              group: %{id: group.id, name: group.name},
              player: %{id: player.id, name: player.name}
            }, socket}

          {:error, reason} ->
            IO.puts("Failed to create player: #{inspect(reason)}")
            {:error, %{reason: "Failed to create player"}}
        end
      else
        {:error, %{reason: "Group not found"}}
      end
    rescue
      e ->
        IO.puts("JOIN ERROR: #{inspect(e)}")
        IO.puts("Stacktrace: #{Exception.format_stacktrace(__STACKTRACE__)}")
        {:error, %{reason: "Join failed: #{inspect(e)}"}}
    end
  end

  def handle_info(:after_join, socket) do
    group_id = socket.assigns.group_id

    # Send the current list of players
    players =
      Groups.list_group_players(group_id)
      |> Enum.map(fn p -> %{id: p.id, name: p.name} end)

    # Send active games if any
    # For simplicity, we're not handling active games here
    # but you could fetch them from GameServer processes

    push(socket, "players_list", %{players: players})

    # Broadcast that a new player joined
    broadcast_from!(socket, "player_joined", %{
      player: %{
        id: socket.assigns.player_id,
        name: socket.assigns.player_name
      }
    })

    {:noreply, socket}
  end

  @doc """
  Handle client events for creating and interacting with games.
  """
  def handle_in("create_letters_game", _, socket) do
    group_id = socket.assigns.group_id

    case GameManager.create_letters_game(group_id) do
      {:ok, game} ->
        {:reply, {:ok, %{game_id: game.id}}, socket}

      {:error, changeset} ->
        IO.puts("Failed to create game: #{inspect(changeset)}")
        {:reply, {:error, %{reason: "Failed to create game #{inspect(changeset.errors)}"}}, socket}
    end
  end

  # TODO move numbers arguments to start game
  def handle_in(
        "create_numbers_game",
        %{"duration" => duration, "large_count" => large_count},
        socket
      ) do
    group_id = socket.assigns.group_id

    case GameManager.create_numbers_game(group_id, large_count, duration) do
      {:ok, game} ->
        {:reply, {:ok, %{game_id: game.id}}, socket}

      {:error, changeset} ->
        IO.puts("Failed to create game: #{inspect(changeset)}")
        {:reply, {:error, %{reason: "Failed to create game #{inspect(changeset.errors)}"}}, socket}
    end
  end

  def handle_in("create_conundrum_game", %{"duration" => duration}, socket) do
    group_id = socket.assigns.group_id

    case GameManager.create_conundrum_game(group_id, duration) do
      {:ok, game} ->
        {:reply, {:ok, %{game_id: game.id}}, socket}

      {:error, changeset} ->
        IO.puts("Failed to create game: #{inspect(changeset)}")
        {:reply, {:error, %{reason: "Failed to create game #{inspect(changeset.errors)}"}}, socket}
    end
  end

  def handle_in("start_game", %{"game_id" => game_id, "options" => options}, socket) do
    case GameManager.start_game(game_id, options) do
      {:ok} ->
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  def handle_in("submit_answer", %{"game_id" => game_id, "value" => value}, socket) do
    player_id = socket.assigns.player_id

    IO.puts("value: #{inspect(value)}")

    case GameManager.submit_value(game_id, player_id, value) do
      {:ok, submission} ->
        {:reply, {:ok, %{submission_id: submission.id}}, socket}

      {:error, _reason} ->
        {:reply, {:error, %{reason: "Failed to submit answer"}}, socket}
    end
  end

  def handle_in("end_game", %{"game_id" => game_id}, socket) do
    case GameManager.end_game(game_id) do
      :ok ->
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  def handle_in("get_game_results", %{"game_id" => game_id}, socket) do
    case GameManager.get_game_results(game_id) do
      {:ok, results} ->
        {:reply, {:ok, %{results: results}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  def handle_in("get_word_distribution", %{"game_id" => game_id}, socket) do
    case GameManager.get_game_results(game_id) do
      {:ok, %{word_distribution: distribution}} ->
        {:reply, {:ok, %{distribution: distribution}}, socket}

      _ ->
        {:reply, {:error, %{reason: "Failed to get word distribution"}}, socket}
    end
  end

  def handle_in("get_all_words", %{"game_id" => game_id}, socket) do
    IO.puts("get_all_words: #{inspect(game_id)}")
    case GameManager.get_game_results(game_id) do
      {:ok, %{all_words: words}} ->
        IO.puts("all_words: #{inspect(words)}")
        {:reply, {:ok, %{words: words}}, socket}

      _ ->
        {:reply, {:error, %{reason: "Failed to get words list"}}, socket}
    end
  end

  def handle_in("get_number_solutions", %{"game_id" => game_id}, socket) do
    case GameManager.get_game_results(game_id) do
      {:ok, %{possible: possible, solutions: solutions}} ->
        {:reply, {:ok, %{possible: possible, solutions: solutions}}, socket}

      _ ->
        {:reply, {:error, %{reason: "Failed to get solutions"}}, socket}
    end
  end

  # Handle incoming broadcasts from the GameServer processes
  def handle_out(event, payload, socket) do
    push(socket, event, payload)
    {:noreply, socket}
  end
end
