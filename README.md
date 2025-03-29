# Countdown Game API

A WebSocket-based API for the Countdown TV Game Show built with Elixir and Phoenix.

## Features

- **Group Management**: Create and join groups of players
- **Three Game Types**:
  - **Letters Game**: Make the longest word from 9 random letters
  - **Numbers Game**: Use arithmetic to reach a target number
  - **Conundrum Game**: Solve a 9-letter anagram
- **Real-time Communication**: WebSockets for instant updates
- **Game History**: Track all games and submissions
- **End-of-Game Analysis**:
  - Word length distribution
  - All possible words
  - Number solutions

## Technology Stack

- **Elixir**: Functional programming language
- **Phoenix**: Web framework with WebSocket support
- **Ecto**: Database wrapper and query generator
- **PostgreSQL**: Relational database

## Getting Started

### Prerequisites

- Elixir 1.14+
- PostgreSQL
- Mix (comes with Elixir)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/countdown_api.git
   cd countdown_api
   ```

2. Install dependencies:
   ```
   mix deps.get
   ```

3. Set up the database:
   ```
   mix ecto.setup
   ```

4. Create a dictionary file:
   ```
   mkdir -p priv/data
   # Add a list of words to priv/data/dictionary.txt
   # You can use a standard English dictionary file
   ```

5. Start the Phoenix server:
   ```
   mix phx.server
   ```

The API is now available at `ws://localhost:4000/socket`.

## API Usage

For full API documentation, see the [API Specification](API_SPECIFICATION.md).

### Basic Usage Example

1. Connect to the WebSocket:
   ```javascript
   const socket = new Phoenix.Socket("ws://localhost:4000/socket", {
     params: { player_name: "Player1" }
   });
   socket.connect();
   ```

2. Join a group:
   ```javascript
   const channel = socket.channel("group:MyGroup", { player_name: "Player1" });
   channel.join()
     .receive("ok", response => console.log("Joined successfully", response))
     .receive("error", response => console.log("Failed to join", response));
   ```

3. Create a letters game:
   ```javascript
   channel.push("create_letters_game", { duration: 30 })
     .receive("ok", response => console.log("Game created", response))
     .receive("error", response => console.log("Error", response));
   ```

4. Submit an answer:
   ```javascript
   channel.push("submit_answer", { game_id: 123, value: "COUNTDOWN" })
     .receive("ok", response => console.log("Answer submitted", response))
     .receive("error", response => console.log("Error", response));
   ```

5. Listen for game events:
   ```javascript
   channel.on("game_started", payload => console.log("Game started", payload));
   channel.on("new_submission", payload => console.log("New submission", payload));
   channel.on("game_ended", payload => console.log("Game ended", payload));
   ```

## Development

### Project Structure

- `lib/countdown_api/` - Business logic
  - `schemas/` - Database schema definitions
  - `dictionary.ex` - Word validation service
  - `game_server.ex` - GenServer for game state
  - `game_manager.ex` - Game creation and coordination
  - `groups.ex` - Group management

- `lib/countdown_api_web/` - Web interface
  - `channels/` - WebSocket channels
  - `endpoint.ex` - Phoenix endpoint

### Running Tests

```
mix test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Countdown TV Show](https://en.wikipedia.org/wiki/Countdown_(game_show)) for the inspiration
- [Phoenix Framework](https://www.phoenixframework.org/) for the real-time capabilities
- [Elixir](https://elixir-lang.org/) for the powerful concurrent programming model
