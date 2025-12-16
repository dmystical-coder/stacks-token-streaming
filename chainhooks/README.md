# Chainhooks Configuration

This directory contains the predicate definitions for the Token Streaming Chainhooks.

## Usage

1. **Register Chainhooks**:
   You can register these hooks using the Hiro Chainhook CLI or Platform.

2. **Endpoints**:
   These hooks are configured to send POST requests to `/api/chainhook`.

3. **Events**:
   - `stream-event.json`: Watches for `create-stream` calls.
   - `withdraw-event.json`: Watches for `withdraw-from-stream` calls.
   - `lifecycle-events.json`: Watches for `cancel-stream`, `pause-stream`, and `resume-stream` calls.

## Development

To test locally, ensure your local Chainhook node can reach the `localhost:3000` endpoint.

