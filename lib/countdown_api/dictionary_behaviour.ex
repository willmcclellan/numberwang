# lib/countdown_api/dictionary_behaviour.ex
defmodule CountdownApi.DictionaryBehaviour do
  @callback valid_word?(String.t()) :: boolean()
  @callback find_words(list(String.t()), integer()) :: list(String.t())
  @callback word_length_distribution(list(String.t())) :: map()
  @callback can_form_word?(String.t(), list(String.t())) :: boolean()
end
