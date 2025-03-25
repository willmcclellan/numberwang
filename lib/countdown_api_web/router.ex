defmodule CountdownApiWeb.Router do
  use CountdownApiWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", CountdownApiWeb do
    pipe_through :api
    
    resources "/groups", GroupController, only: [:index, :show, :create] do
      resources "/players", PlayerController, only: [:index, :show, :create]
      resources "/games", GameController, only: [:index, :show]
    end
  end

  # Enable LiveDashboard in development
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through [:fetch_session, :protect_from_forgery]
      live_dashboard "/dashboard", metrics: CountdownApiWeb.Telemetry
    end
  end
end
