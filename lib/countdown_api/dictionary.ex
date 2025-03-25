defmodule CountdownApi.Dictionary do
  @moduledoc """
  Service for validating words and finding possible words from a set of letters.
  This implementation uses an ETS table for efficient lookups.
  """

  use GenServer

  @dictionary_file "priv/data/dictionary.txt"
  @table_name :dictionary

  def start_link(_) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end
  
  @impl true
  def init(_) do
    :ets.new(@table_name, [:set, :protected, :named_table])
    load_dictionary()
    {:ok, []}
  end

  @doc """
  Check if word exists in the dictionary.
  """
  def valid_word?(word) do
    :ets.member(@table_name, String.downcase(word))
  end

  @doc """
  Find all possible words from a set of letters.
  """
  def find_words(letters, min_length \\ 3) do
@impl true

  @doc """
  Get word distribution by length from the available letters.
  Returns a map where keys are word lengths and values are counts.
  """
  def word_length_distribution(letters) do
    letters = letters |> Enum.map(&String.downcase/1)
    
    # Find all possible words
    words = find_words(letters, 3)
    
    # Group by length
    words
    |> Enum.group_by(&String.length/1)
    |> Enum.map(fn {length, words} -> {length, length(words)} end)
    |> Enum.into(%{})
  end

  @doc """
  Check if a word can be formed from the given letters.
  """
  def can_form_word?(word, letters) when is_binary(word) and is_list(letters) do
    word_chars = word |> String.downcase() |> String.graphemes()
    can_form_word?(word_chars, letters)
  end

  defp can_form_word?([], _), do: true
  defp can_form_word?([h | t], letters) do
    if h in letters do
      # Remove the first occurrence of the letter
      remaining = List.delete(letters, h)
      can_form_word?(t, remaining)
    else
      false
    end
  end

  defp load_dictionary do
    # This will load a sample dictionary for development
    File.stream!(@dictionary_file)
    |> Stream.map(&String.trim/1)
    |> Stream.filter(fn word -> String.length(word) >= 3 end)
    |> Enum.each(fn word ->
      :ets.insert(@table_name, {String.downcase(word), true})
    end)
  end
end
