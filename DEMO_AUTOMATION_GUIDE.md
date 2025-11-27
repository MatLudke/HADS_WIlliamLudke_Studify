# Demo Automation Guide

## Overview

The `demo-automation.js` script automates UI interactions for your Studify college presentation. It has been completely rewritten (v2.0) to work with your actual component structure.

## Key Improvements in v2.0

### 1. **Accurate Element Selectors**

Previously, the script used generic selectors that didn't match your actual DOM structure. Now it uses:

- **Input fields by ID**: `input[id="title"]`, `input[id="subject"]`, `input[id="duration"]`
- **Select dropdowns**: Properly clicks triggers and finds options by `data-value` attribute
- **Icon-only buttons**: Uses Lucide icon classes like `svg.lucide-pause`, `svg.lucide-square`

### 2. **Component-Aware Interactions**

#### Activity Dialog

```javascript
// OLD (didn't work): 'input[name="title"]'
// NEW (works): 'input[id="title"]'
```

Your ActivityDialog uses `id` attributes for form fields, not `name` attributes. The script now matches this.

#### Timer Controls

```javascript
// OLD: Looking for text like "Pause"
// NEW: Looking for icon classes like 'svg.lucide-pause'
```

Your timer buttons use icons without text, so we find them by their Lucide icon classes.

#### Select Dropdowns

```javascript
// OLD: Tried to use invalid CSS selectors
// NEW: Click trigger → Find option by data-value → Click option
await clickElement('[id="priority"]', "Priority dropdown");
await wait(300);
const option = Array.from(document.querySelectorAll('[role="option"]')).find(
  (opt) => opt.getAttribute("data-value") === "high"
);
option.click();
```

### 3. **Helper Functions**

New helper functions make the code more reliable:

```javascript
// Find any button by its text content
findButtonByText("Add Activity");
findButtonByText("Create");
findButtonByText("Start");

// Click a button with visual feedback
await clickButtonByText("Add Activity", "Add Activity Button");
```

## Usage Instructions

### Setup

1. **Start your app**: `npm run dev`
2. **Navigate to dashboard**: `http://localhost:3000/dashboard`
3. **Log in**: Make sure you're authenticated
4. **Open console**: Press F12 → Console tab
5. **Load script**: Copy entire `demo-automation.js` and paste into console

### Running Demos

#### Quick Demo (1 minute)

```javascript
await runQuickDemo();
```

Creates one activity and generates flashcards. Perfect for short presentations.

#### Full Demo (3-4 minutes)

```javascript
await runFullDemo();
```

Complete walkthrough:

- Creates 2 activities with goals
- Starts and controls Pomodoro timer
- Generates AI flashcards
- Auto-answers flashcards
- Navigates to Reports and Settings
- Toggles theme

#### Focused Demos

```javascript
// Just activity creation
await demoCreateActivity(0); // Math activity
await demoCreateActivity(1); // History activity
await demoCreateActivity(2); // Programming activity

// Just timer
await demoStartTimer();
await demoPauseTimer();
await demoStopTimer();
await demoResetTimer();

// Just flashcards
await demoGenerateFlashcards(0); // Portuguese
await demoGenerateFlashcards(1); // English
await demoAnswerFlashcards();
```

## Troubleshooting

### Script Doesn't Load

**Symptom**: Syntax errors when pasting script
**Solution**: Make sure you copied the entire file, including the last line

### Buttons Not Found

**Symptom**: `❌ Element not found` errors
**Solution**: Use debug tools to inspect the page:

```javascript
debugShowButtons(); // Lists all buttons
debugShowInputs(); // Lists all inputs
debugShowDialog(); // Checks if dialog is open
```

### Dialog Doesn't Open

**Symptom**: "Add Activity" button click doesn't work
**Solution**:

1. Make sure you're on `/dashboard` page
2. Check if you're logged in
3. Run `debugShowButtons()` to verify button exists

### Timer Controls Don't Work

**Symptom**: Pause/Stop buttons not clicking
**Solution**:

1. Make sure timer is running (click Start first)
2. Icons might have different classes - check with `debugShowButtons()`

### Flashcard Input Not Found

**Symptom**: Can't type subject
**Solution**:

1. Scroll down to flashcard section first
2. Run `debugShowInputs()` to see available inputs
3. Flashcard input should be visible on page

## Demo Data Configuration

Edit `DEMO_CONFIG` at the top of the script to customize:

```javascript
const DEMO_CONFIG = {
  // Timing
  TYPING_SPEED: 80, // ms per character (human-like typing)
  PAUSE_SHORT: 1000, // 1 second pause
  PAUSE_MEDIUM: 2000, // 2 seconds pause
  PAUSE_LONG: 3000, // 3 seconds pause

  // Activities to create
  ACTIVITIES: [
    {
      title: "Matemática - Cálculo I",
      subject: "Derivadas e Integrais",
      duration: 60,
      priority: "high",
      goalType: "daily",
      goalTarget: 120,
      goalReminders: true,
    },
    // Add more activities...
  ],

  // Flashcard subjects
  FLASHCARD_SUBJECTS: [
    { subject: "Segunda Guerra Mundial", difficulty: 2, language: "pt" },
    // Add more subjects...
  ],
};
```

## Visual Effects

The script includes visual feedback during automation:

1. **Red Border Highlight**: Elements flash red before being clicked
2. **Smooth Scrolling**: Elements scroll into view smoothly
3. **Human-Like Typing**: Text appears character-by-character at 80ms/char
4. **Natural Pauses**: Waits between actions to simulate human behavior

## Best Practices for Presentation

### Before Demo

1. ✅ Clear browser cache (to avoid stale data)
2. ✅ Log in with test account
3. ✅ Delete any existing activities (start fresh)
4. ✅ Test script in advance with `runQuickDemo()`
5. ✅ Prepare backup: know how to do actions manually

### During Demo

1. 📺 **Full Screen**: F11 to hide browser chrome
2. 🎤 **Narrate**: Explain what's happening while script runs
3. ⏸️ **Pause**: Let animations complete before next action
4. 🔍 **Point Out**: Highlight key features as they appear
5. 💬 **Engage**: Ask questions while waiting for AI generation

### Talking Points

While script runs, mention:

#### Activity Creation

- "Goal tracking feature helps students stay accountable"
- "Email reminders ensure they don't fall behind"
- "Supports daily, weekly, and monthly goals"

#### Pomodoro Timer

- "Based on proven time management technique"
- "Tracks actual time spent vs estimated"
- "Saves sessions to Firebase automatically"

#### AI Flashcards

- "Uses Genkit AI to generate educational content"
- "Supports 12+ languages automatically"
- "Difficulty adapts to student level"
- "Progress tracked with accuracy metrics"

#### Code Quality

- "Fixed 8 critical bugs from code review"
- "Implemented optimistic updates with rollback"
- "Input validation prevents security issues"
- "Memory leak fixed in timer component"

## Technical Implementation Details

### How It Works

1. **DOM Traversal**: Finds elements using standard JavaScript DOM APIs
2. **Event Simulation**: Triggers React events (`input`, `change`, `click`)
3. **Async/Await**: Properly waits for animations and network requests
4. **Error Handling**: Graceful degradation with console errors

### React Integration

The script works by:

- Dispatching DOM events that React listens for
- Using `bubbles: true` so events reach React components
- Triggering both `input` (for typing) and `change` (for form submission)

### Component Compatibility

Tested with:

- ✅ React Hook Form (activity dialog)
- ✅ Shadcn/ui Select components
- ✅ Framer Motion animations
- ✅ Custom form validation

## Future Enhancements

Possible improvements:

1. **AI Data Generation**: Use Poe API to generate realistic activity data
2. **Voice Narration**: Text-to-speech explains actions
3. **Recording Mode**: Export demo as video
4. **Error Recovery**: Auto-retry failed actions
5. **Custom Scenarios**: Teacher-specific demo paths

## Files Modified

- `demo-automation.js` - Main automation script (v2.0)
- `DEMO_AUTOMATION_GUIDE.md` - This guide

## Related Documentation

- `CODE_REVIEW_BUGS.md` - List of bugs found in code review
- `FIXES_IMPLEMENTED.md` - Summary of bug fixes applied
- `docs/blueprint.md` - Original project architecture

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Use debug tools: `debugShowButtons()`, `debugShowInputs()`, `debugShowDialog()`
3. Inspect browser console for error messages
4. Verify you're on correct page (`/dashboard`)
5. Test manual actions first (if script can't do it, you can't either)

## Version History

### v2.0 (Current)

- ✅ Rewritten to match actual component structure
- ✅ Uses correct element selectors (IDs, data attributes)
- ✅ Handles icon-only buttons via Lucide classes
- ✅ Proper Select dropdown interaction
- ✅ Added debug helper functions
- ✅ Improved error messages

### v1.0 (Previous)

- ❌ Used generic/invalid selectors
- ❌ Assumed testing framework syntax (`:has-text()`)
- ❌ Didn't match actual DOM structure
- ❌ Many false positives and failures

---

**Good luck with your presentation! 🎓🍀**
