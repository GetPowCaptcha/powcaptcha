# @powcaptcha/signals-analyzer

This module analyzes a collection of user interaction signals (keyboard events, mouse movements, timing, etc.) to calculate a `probability score` (0 to 1) indicating whether the behavior is a bot(0) or human (1). It is designed to be used _after_ the signals have been collected.

## Key Features

- Calculates a **bot vs. human** probability score (0 = bot, 1 = human).
- Uses multiple **heuristics** for analysis:
  - Global interaction timing.
  - Pointer movement (speed, distance, hesitations).
  - Keystroke patterns (WPM speed, intervals, press duration).
  - Event sequences (double-click, Enter->Submit, input without prior action, Paste->Submit).
  - Contextual analysis of 'paste' events (field type, name/id, frequency, scaling).
  - Presence of scroll events.
  - Tab/window visibility changes.

## Installation

```bash
npm install @powcaptcha/signals-analyzer
# or
yarn add @powcaptcha/signals-analyzer
# or
pnpm add @powcaptcha/signals-analyzer
```

## Basic Usage

```typescript
import { SignalsAnalyzer } from '@powcaptcha/signals-analyzer';

const analyzer = new SignalsAnalyzer(collectedData);

const score = analyzer.calculateProbability();

console.log(`Probability Score (0=bot, 1=human): ${score.toFixed(3)}`);
const analysisLog = analyzer.getAnalysisLog();
```
