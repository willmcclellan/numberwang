defmodule CountdownApiWeb.GroupChannelTest do
  use CountdownApiWeb.ChannelCase

  alias CountdownApi.{Repo, GameManager, Groups}
  alias CountdownApi.Schemas.{Submission}

  setup do
    # Create a test group for our tests
    {:ok, group} = Groups.create_group(%{name: "TestGroup"})
    {:ok, player} = Groups.create_player(%{name: "TestPlayer", group_id: group.id})

    # Connect a socket with player name
    {:ok, socket} = connect(CountdownApiWeb.UserSocket, %{"player_name" => "TestPlayer"})

    # subscribe to the topic
    topic = "group:#{group.id}"
    @endpoint.subscribe(topic)

    # Return the socket, group, and player for use in tests
    {:ok, socket: socket, group: group, player: player}
  end

  describe "joining a group channel" do
    test "allows joining existing groups", %{socket: socket, group: group} do
      # Join the group channel
      {:ok, reply, socket} = join(socket, "group:#{group.name}", %{"player_name" => "TestPlayer"})

      # Check the response contains the expected data
      assert reply.group.id == group.id
      assert reply.group.name == group.name
      assert reply.player.name == "TestPlayer"

      # Check socket assigns
      assert socket.assigns.group_id == group.id
      assert socket.assigns.player_name == "TestPlayer"
    end

    test "creates a new group when joining non-existent group", %{socket: socket} do
      # Join a channel for a group that doesn't exist yet
      {:ok, reply, socket} = join(socket, "group:NewGroup", %{"player_name" => "TestPlayer"})

      # Check that a new group was created
      assert reply.group.name == "NewGroup"
      assert socket.assigns.group_id

      # Verify the group exists in the database
      assert Groups.get_group_by_name("NewGroup")
    end

    test "sends players list after joining", %{socket: socket, group: group} do
      # Join the group channel
      {:ok, _, _socket} = join(socket, "group:#{group.name}", %{"player_name" => "TestPlayer"})

      # Check that a players_list event is pushed
      assert_push "players_list", %{players: players}
      assert length(players) > 0

      # Check that at least one player in the list is our test player
      assert Enum.any?(players, fn p -> p.name == "TestPlayer" end)
    end
  end

  describe "creating and playing games" do
    setup %{socket: socket, group: group} do
      # Join the group channel before each test in this describe block
      {:ok, _, socket} = join(socket, "group:#{group.name}", %{"player_name" => "TestPlayer"})
      {:ok, socket: socket}
    end

    test "creates a letters game", %{socket: socket} do
      # Request to create a letters game
      ref = push(socket, "create_letters_game", %{"duration" => 30})
      assert_reply ref, :ok, %{game_id: game_id}

      # Verify game was created in the database
      game = GameManager.get_game(game_id)
      assert game
      assert game.game_type == "letters"
      assert game.duration == 30
      assert length(game.letters) == 9

      ref = push(socket, "start_game", %{"game_id" => game_id})
      assert_reply ref, :ok

      # Check for game_started broadcast
      assert_broadcast "game_started", %{game: game_data}, 4000
      assert game_data.id == game_id
      assert game_data.game_type == "letters"
    end

    test "creates a numbers game", %{socket: socket} do
      # Request to create a numbers game
      ref = push(socket, "create_numbers_game", %{"duration" => 30, "large_count" => 2})

      # Check response
      assert_reply ref, :ok, %{game_id: game_id}

      # Verify game was created
      game = GameManager.get_game(game_id)
      assert game
      assert game.game_type == "numbers"
      assert game.large_number_count == 2
      assert length(game.numbers) == 6
      assert is_integer(game.target)

      ref = push(socket, "start_game", %{"game_id" => game_id})
      assert_reply ref, :ok

      # Check for game_started broadcast
      assert_broadcast "game_started", %{game: game_data}, 4000
      assert game_data.id == game_id
    end

    test "submits an answer to a game", %{socket: socket} do
      # Create a game
      ref = push(socket, "create_letters_game", %{"duration" => 30})
      assert_reply ref, :ok, %{game_id: game_id}

      # Submit an answer
      # Assuming this is a valid word
      answer = "TEST"
      ref = push(socket, "submit_answer", %{"game_id" => game_id, "value" => answer})

      # Check response
      assert_reply ref, :ok, %{submission_id: submission_id}

      # Verify broadcast
      assert_broadcast "new_submission", submission
      assert submission.value == answer

      # Verify submission was saved
      submission = Repo.get(Submission, submission_id)
      assert submission
      assert submission.value == answer
      assert submission.game_id == game_id
    end
  end
end
