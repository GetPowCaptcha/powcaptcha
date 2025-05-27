# @powcaptcha/logger

Simple logging utility for development and debugging purposes. It is compatible with console.log, console.warn, and console.error.

## Installation

```bash
npm install @powcaptcha/logger
# or
yarn add @powcaptcha/logger
# or
pnpm add @powcaptcha/logger
```

## Controlling Log Output

You can control which logs are shown by setting the `DEBUG_SCOPES` key in your browser's `localStorage`. This lets you filter log output by scope during development, without changing your code.

### How to use

- **Show all logs:**  
   Set `localStorage.setItem('DEBUG_SCOPES', '*')`
  Or delete the `DEBUG_SCOPES` key from `localStorage`.

- **Show logs only from specific scopes:**  
   Set `localStorage.setItem('DEBUG_SCOPES', 'widget:orchestrator')`

- **Show logs from all scopes starting with a prefix:**  
   Set `localStorage.setItem('DEBUG_SCOPES', 'widget:*')`

### Example Usage

```javascript
import { createLogger } from '@powcaptcha/logger';
const Logger = createLogger("mynamespace:something');
Logger.log('This is a log message');
Logger.warn('This is a warning message');
Logger.error('This is an error message');
```
