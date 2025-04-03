# test/countdown_api_web/integration/game_flow_test.exs
defmodule CountdownApiWeb.Integration.GameFlowTest do
  use CountdownApiWeb.ChannelCase

  alias CountdownApi.Repo
  alias CountdownApi.Schemas.Submission
  import Ecto.Query

  setup do
    # Connect two player sockets
    {:ok, socket1} = connect(CountdownApiWeb.UserSocket, %{"player_name" => "Player1"})
    {:ok, socket2} = connect(CountdownApiWeb.UserSocket, %{"player_name" => "Player2"})

    # Join the same group
    {:ok, _, socket1} = Phoenix.ChannelTest.join(socket1, "group:TestGame", %{"player_name" => "Player1"})
    {:ok, _, socket2} = Phoenix.ChannelTest.join(socket2, "group:TestGame", %{"player_name" => "Player2"})

    {:ok, socket1: socket1, socket2: socket2}
  end

  test "full letters game flow", %{socket1: socket1, socket2: socket2} do
    # Join with error handling
    case Phoenix.ChannelTest.join(socket1, "group:TestGame", %{"player_name" => "will" }) do
      {:ok, _, _socket} -> 
        :ok
      {:error, reason} -> 
        flunk("Failed to join channel: #{inspect(reason)}")
    end

    topic = "group:#{socket1.assigns.group_id}"
    @endpoint.subscribe(topic)

    # Player 1 creates a game
    # Short duration for testing
    ref = push(socket1, "create_letters_game", %{"duration" => 30})
    assert_reply ref, :ok, %{game_id: game_id}

    # any player starts the game
    ref = push(socket1, "start_game", %{"game_id" => game_id})
    assert_reply ref, :ok

    # Both players should receive the game_started event
    assert_broadcast "game_started", %{game: _game_data}, 4000

    # Both players submit answers
    ref = push(socket1, "submit_answer", %{"game_id" => game_id, "value" => "CAT"})
    assert_reply ref, :ok, %{submission_id: _submission_id1}
    ref = push(socket2, "submit_answer", %{"game_id" => game_id, "value" => "HAT"})
    assert_reply ref, :ok, %{submission_id: _submission_id2}

    # Both should receive submission broadcasts
    assert_broadcast "new_submission", %{value: "CAT"}, 1000
    assert_broadcast "new_submission", %{value: "HAT"}, 1000

    # Should receive game_ended broadcast
    assert_broadcast "game_ended", %{game_id: ^game_id, results: results}, 4000

    # Check that a winner was declared
    assert results.winner

    # Get end-of-game information
    ref = push(socket1, "get_all_words", %{"game_id" => game_id})
    assert_reply ref, :ok, %{words: words}
    assert is_list(words)

    # Verify submissions were saved to database
    submissions = Repo.all(from s in Submission, where: s.game_id == ^game_id)
    assert length(submissions) == 2
  end
end
