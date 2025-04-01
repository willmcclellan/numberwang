defmodule CountdownApi.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      CountdownApiWeb.Telemetry,
      CountdownApi.Repo,
      {DNSCluster, query: Application.get_env(:countdown_api, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: CountdownApi.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: CountdownApi.Finch},
      # Start Registry and GameSupervisor (before services that need them)
      {Registry, keys: :unique, name: CountdownApi.GameRegistry},
      {DynamicSupervisor, name: CountdownApi.GameSupervisor, strategy: :one_for_one},
      # Start the Dictionary Service
      CountdownApi.Dictionary,
      # Start to serve requests, typically the last entry
      CountdownApiWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: CountdownApi.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    CountdownApiWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
