# Define a test for the game logic using a mock dictionary
# test/countdown_api/game_logic_test.exs
defmodule CountdownApi.GameLogicTest do
  use ExUnit.Case
  import Mox

  defmock(CountdownApi.MockDictionary, for: CountdownApi.DictionaryBehaviour)

  defmodule GameLogic do
    # Make the dictionary module configurable
    def validate_submission(game, value, dictionary \\ CountdownApi.Dictionary) do
      case game.game_type do
        "letters" ->
          if dictionary.valid_word?(value) &&
               dictionary.can_form_word?(value, game.letters) do
            {:ok, String.length(value)}
          else
            {:error, :invalid_word}
          end

        "numbers" ->
          # Simplified for demo
          {:ok, 5}
      end
    end
  end

  describe "game logic with mocked dictionary" do
    setup :verify_on_exit!

    test "validates a valid letters submission" do
      # Create a test game
      game = %{game_type: "letters", letters: ["A", "P", "P", "L", "E"]}

      # Set up our mock to return specific values
      CountdownApi.MockDictionary
      |> expect(:valid_word?, fn "apple" -> true end)
      |> expect(:can_form_word?, fn "apple", ["A", "P", "P", "L", "E"] -> true end)

      # Call our function with the mock
      result =
        GameLogic.validate_submission(
          game,
          "apple",
          CountdownApi.MockDictionary
        )

      assert result == {:ok, 5}
    end

    test "rejects an invalid letters submission" do
      game = %{game_type: "letters", letters: ["A", "P", "P", "L", "E"]}

      CountdownApi.MockDictionary
      |> expect(:valid_word?, fn "banana" -> true end)
      |> expect(:can_form_word?, fn "banana", ["A", "P", "P", "L", "E"] -> false end)

      result =
        GameLogic.validate_submission(
          game,
          "banana",
          CountdownApi.MockDictionary
        )

      assert result == {:error, :invalid_word}
    end
  end
end
