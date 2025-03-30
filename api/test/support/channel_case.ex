defmodule CountdownApiWeb.ChannelCase do
  @moduledoc """
  This module defines the test case to be used by
  channel tests.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with channels
      import Phoenix.ChannelTest
      import CountdownApiWeb.ChannelCase

      # The default endpoint for testing
      @endpoint CountdownApiWeb.Endpoint
    end
  end

  setup tags do
    CountdownApi.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
