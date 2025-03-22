defmodule CountdownApi.Repo do
  use Ecto.Repo,
    otp_app: :countdown_api,
    adapter: Ecto.Adapters.Postgres
end
