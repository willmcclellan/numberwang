# Countdown Game API Specification

This document outlines the WebSocket-based API for the Countdown game application, detailing all events, messages, and their expected payloads.

## Connection

The API uses Phoenix Channels (WebSockets) for real-time communication.

### Base URL
```
ws://localhost:4000/socket
```

### Connection Parameters
When connecting to the socket, include:
```json
{
  "player_name": "YourName"
}
```

## Channels

### Group Channel
Join a group to participate in games:
```
group:{group_name}
```

#### Join Payload
```json
{
  "player_name": "YourName"
}
```

#### Join Response
```json
{
  "group": {
    "id": 123,
    "name": "MyGroup"
  },
  "player": {
    "id": 456,
    "name": "YourName"
  }
}
```

## Client Events (send to server)

### Create Games

#### Create Letters Game
```json
{
  "event": "create_letters_game",
  "payload": {
    "duration": 30  // or 60 seconds
  }
}
```

#### Create Numbers Game
```json
{
  "event": "create_numbers_game",
  "payload": {
    "duration": 30,  // or 60 seconds
    "large_count": 2  // Number of large numbers (1-4)
  }
}
```

#### Create Conundrum Game
```json
{
  "event": "create_conundrum_game",
  "payload": {
    "duration": 30  // typically 30 seconds
  }
}
```

### Game Interaction

#### Submit Answer
```json
{
  "event": "submit_answer",
  "payload": {
    "game_id": 789,
    "value": "COUNTDOWN"  // For letters/conundrum game
    // OR
    "value": "100+5*4"    // For numbers game
  }
}
```

#### End Game (optional, normally ends automatically)
```json
{
  "event": "end_game",
  "payload": {
    "game_id": 789
  }
}
```

### Game Results

#### Get Word Distribution (Letters Game)
```json
{
  "event": "get_word_distribution",
  "payload": {
    "game_id": 789
  }
}
```

#### Get All Words (Letters Game)
```json
{
  "event": "get_all_words",
  "payload": {
    "game_id": 789
  }
}
```

#### Get Number Solutions (Numbers Game)
```json
{
  "event": "get_number_solutions",
  "payload": {
    "game_id": 789
  }
}
```

#### Get Complete Game Results
```json
{
  "event": "get_game_results",
  "payload": {
    "game_id": 789
  }
}
```

## Server Events (received from server)

### Group Events

#### Players List (received after joining)
```json
{
  "event": "players_list",
  "payload": {
    "players": [
      {"id": 123, "name": "Player1"},
      {"id": 456, "name": "Player2"}
    ]
  }
}
```

#### Player Joined
```json
{
  "event": "player_joined",
  "payload": {
    "player": {
      "id": 789,
      "name": "NewPlayer"
    }
  }
}
```

### Game Events

#### Game Started
```json
{
  "event": "game_started",
  "payload": {
    "game": {
      "id": 123,
      "game_type": "letters", // or "numbers" or "conundrum"
      "duration": 30,
      "letters": ["C", "O", "U", "N", "T", "D", "O", "W", "N"], // for letters/conundrum
      "numbers": [100, 25, 10, 4, 3, 2], // for numbers
      "target": 457, // for numbers
      "started_at": "2023-03-20T12:34:56Z",
      "group_id": 456
    }
  }
}
```

#### New Submission
```json
{
  "event": "new_submission",
  "payload": {
    "player_id": 789,
    "value": "COUNTDOWN",
    "valid": true,
    "score": 9
  }
}
```

#### Game Ended
```json
{
  "event": "game_ended",
  "payload": {
    "game_id": 123,
    "results": {
      "game_id": 123,
      "game_type": "letters",
      "winner": {
        "player_id": 789,
        "player_name": "Player1",
        "value": "COUNTDOWN",
        "score": 9
      },
      "submissions": [
        {
          "player_id": 789,
          "player_name": "Player1",
          "value": "COUNTDOWN",
          "valid": true,
          "score": 9
        },
        {
          "player_id": 101,
          "player_name": "Player2",
          "value": "COUNT",
          "valid": true,
          "score": 5
        }
      ]
    }
  }
}
```

## Response Formats for Client Events

### Success Responses

#### Create Game
```json
{
  "game_id": 123
}
```

#### Submit Answer
```json
{
  "submission_id": 456
}
```

#### Word Distribution
```json
{
  "distribution": {
    "3": 10,
    "4": 15,
    "5": 8,
    "6": 5,
    "7": 2,
    "8": 1,
    "9": 0
  }
}
```

#### All Words
```json
{
  "words": ["COUNTDOWN", "COUNT", "DOWN", ...]
}
```

#### Number Solutions
```json
{
  "possible": true,
  "solutions": ["100+25*4-3"]
}
```

#### Game Results
```json
{
  "results": {
    // Depends on game type, combines relevant results from above
  }
}
```

### Error Responses
```json
{
  "reason": "Error message describing what went wrong"
}
```

## Game Type-Specific Features

### Letters Game
- 9 random letters (mix of vowels and consonants)
- Players submit the longest word they can make
- Words validated against dictionary
- Scoring based on word length

### Numbers Game
- 6 numbers (mix of large and small)
- Target number to reach
- Players submit arithmetic expressions
- Solutions checked for validity and closeness to target

### Conundrum Game
- 9 letters forming an anagram of a specific word
- Players race to find the correct word
- First correct answer wins

## Implementation Notes

1. All timestamps are in ISO 8601 UTC format
2. Game IDs, Player IDs, and Group IDs are integers
3. Game durations are in seconds (30 or 60)
4. The server maintains game state and validates all submissions
5. Games automatically end after the specified duration
