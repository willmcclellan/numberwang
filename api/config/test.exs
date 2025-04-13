import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :countdown_api, CountdownApi.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "countdown_api_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :countdown_api, CountdownApiWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "EWPcnyWpT6rXUmO3Rv39LSAWDeo9D6DynVTCTEFkRM5S43BkNlOb4vMDvbwUeENc",
  server: false

# In test we don't send emails
config :countdown_api, CountdownApi.Mailer, adapter: Swoosh.Adapters.Test

# Mock the dictionary API
config :countdown_api, dictionary: CountdownApi.MockDictionary

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
