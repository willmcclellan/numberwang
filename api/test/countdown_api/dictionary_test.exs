defmodule CountdownApi.DictionaryTest do
  use ExUnit.Case, async: false

  # Test the real dictionary with some known words
  describe "real dictionary" do
    test "validates words" do
      assert CountdownApi.Dictionary.valid_word?("apple")
      refute CountdownApi.Dictionary.valid_word?("xyzabc123")
    end

    test "finds possible words from letters" do
      letters = ["C", "A", "T"]
      words = CountdownApi.Dictionary.find_words(letters)

      # Should find "cat" at minimum
      assert "cat" in words
    end
  end
end

