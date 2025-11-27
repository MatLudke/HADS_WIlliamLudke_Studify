/**
 * STUDIFY - DEMO AUTOMATION SCRIPT (v2.3)
 *
 * This script simulates a real user interacting with the system during presentations.
 * Now updated to work with the actual component structure!
 *
 * IMPROVEMENTS (v2.3 - Duolingo-Style Timer! 🔥):
 * - ✅ Stop keeps your progress (not lost anymore!)
 * - ✅ Removed Pause button (simplified to Start/Stop/Reset)
 * - ✅ Resume from where you left off
 * - ✅ Only Reset clears everything
 *
 * IMPROVEMENTS (v2.2 - Duolingo-Style Streaks! 🔥):
 * - ✅ Removed confusing daily/monthly goals
 * - ✅ Simple weekly streak system: "Study X times per week"
 * - ✅ Sessions-based thinking (1-7 sessions/week)
 * - ✅ Streak motivation: Complete your weekly goal or lose your streak!
 *
 * IMPROVEMENTS (v2.1):
 * - ✅ Duration now controls timer preset (UX fix!)
 * - ✅ Realistic session-based planning (25/30/45 min sessions)
 * - ✅ Fixed negative progress bug (-140% → 0%)
 *
 * IMPROVEMENTS (v2.0):
 * - Uses correct element selectors based on actual DOM structure
 * - Matches component IDs and data attributes from your React components
 * - Handles Select dropdowns properly with role="option" and data-value
 * - Uses Lucide icon classes to find icon-only buttons
 * - More reliable element finding with proper fallbacks
 *
 * Usage:
 * 1. Open your app in browser (localhost:3000/dashboard)
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file
 * 4. Run: await runFullDemo()
 *
 * Or run step-by-step:
 * - await demoCreateActivity()
 * - await demoStartTimer()
 * - await demoGenerateFlashcards()
 * - await demoAnswerFlashcards()
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_CONFIG = {
  // Timing (in milliseconds)
  TYPING_SPEED: 80, // ms per character (simulates human typing)
  PAUSE_SHORT: 1000, // 1 second pause
  PAUSE_MEDIUM: 2000, // 2 seconds pause
  PAUSE_LONG: 3000, // 3 seconds pause

  // Demo data
  // NOTE: Duration = timer session length (what shows on Focus Timer)
  //       Weekly Goal = sessions per week (keeps your streak alive! 🔥)
  ACTIVITIES: [
    {
      title: "Matemática - Cálculo I",
      subject: "Derivadas e Integrais",
      duration: 25,          // 25-min Pomodoro sessions
      priority: "high",
      goalType: "weekly",
      goalTarget: 5,         // 🔥 5 sessions per week to maintain streak
      goalReminders: true,
    },
    {
      title: "História - Segunda Guerra",
      subject: "Causas e Consequências",
      duration: 30,          // 30-min study sessions
      priority: "medium",
      goalType: "weekly",
      goalTarget: 3,         // 🔥 3 sessions per week to maintain streak
      goalReminders: true,
    },
    {
      title: "Programação - Next.js",
      subject: "Server Components",
      duration: 45,          // 45-min deep work sessions
      priority: "high",
      goalType: "weekly",
      goalTarget: 4,         // 🔥 4 sessions per week to maintain streak
      goalReminders: false,
    },
  ],

  FLASHCARD_SUBJECTS: [
    { subject: "Segunda Guerra Mundial", difficulty: 2, language: "pt" },
    { subject: "World War II", difficulty: 2, language: "en" },
    { subject: "Revolução Francesa", difficulty: 3, language: "pt" },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wait for specified milliseconds
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulate human typing in an input field
 */
async function typeIntoField(selector, text, speed = DEMO_CONFIG.TYPING_SPEED) {
  const element = document.querySelector(selector);

  if (!element) {
    console.error(`❌ Element not found: ${selector}`);
    return false;
  }

  // Focus the field
  element.focus();
  element.value = "";

  // Type character by character
  for (let i = 0; i < text.length; i++) {
    element.value += text[i];

    // Trigger input event so React sees the change
    const inputEvent = new Event("input", { bubbles: true });
    element.dispatchEvent(inputEvent);

    await wait(speed);
  }

  // Trigger change event
  const changeEvent = new Event("change", { bubbles: true });
  element.dispatchEvent(changeEvent);

  console.log(`✅ Typed: "${text}" into ${selector}`);
  return true;
}

/**
 * Click an element (button, link, etc)
 */
async function clickElement(selector, description = "") {
  const element = document.querySelector(selector);

  if (!element) {
    console.error(`❌ Element not found: ${selector}`);
    return false;
  }

  // Scroll into view
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await wait(500);

  // Add visual highlight
  const originalBorder = element.style.border;
  const originalBoxShadow = element.style.boxShadow;
  element.style.border = "3px solid #ff6b6b";
  element.style.boxShadow = "0 0 20px rgba(255, 107, 107, 0.5)";

  await wait(300);

  // Click
  element.click();

  await wait(200);

  // Remove highlight
  element.style.border = originalBorder;
  element.style.boxShadow = originalBoxShadow;

  console.log(`✅ Clicked: ${description || selector}`);
  return true;
}

/**
 * Find button by text content
 */
function findButtonByText(text) {
  const buttons = Array.from(document.querySelectorAll("button"));
  return buttons.find(
    (btn) =>
      btn.textContent && btn.textContent.trim().toLowerCase().includes(text.toLowerCase())
  );
}

/**
 * Click a button by its text content
 */
async function clickButtonByText(text, description = "") {
  const button = findButtonByText(text);
  if (!button) {
    console.error(`❌ Button not found with text: ${text}`);
    return false;
  }

  // Scroll into view
  button.scrollIntoView({ behavior: "smooth", block: "center" });
  await wait(500);

  // Add visual highlight
  const originalBorder = button.style.border;
  const originalBoxShadow = button.style.boxShadow;
  button.style.border = "3px solid #ff6b6b";
  button.style.boxShadow = "0 0 20px rgba(255, 107, 107, 0.5)";

  await wait(300);

  // Click
  button.click();

  await wait(200);

  // Remove highlight
  button.style.border = originalBorder;
  button.style.boxShadow = originalBoxShadow;

  console.log(`✅ Clicked button: ${description || text}`);
  return true;
}

/**
 * Select option from dropdown
 */
async function selectDropdownOption(triggerSelector, optionText) {
  // Click dropdown trigger
  await clickElement(triggerSelector, "Dropdown trigger");
  await wait(500);

  // Find and click option
  const options = Array.from(document.querySelectorAll('[role="option"]'));
  const option = options.find((opt) => opt.textContent?.includes(optionText));

  if (!option) {
    console.error(`❌ Option not found: ${optionText}`);
    return false;
  }

  option.click();
  console.log(`✅ Selected option: ${optionText}`);
  return true;
}

/**
 * Adjust slider value
 */
async function adjustSlider(selector, value) {
  const slider = document.querySelector(selector);

  if (!slider) {
    console.error(`❌ Slider not found: ${selector}`);
    return false;
  }

  slider.value = value.toString();

  const inputEvent = new Event("input", { bubbles: true });
  slider.dispatchEvent(inputEvent);

  const changeEvent = new Event("change", { bubbles: true });
  slider.dispatchEvent(changeEvent);

  console.log(`✅ Slider set to: ${value}`);
  return true;
}

// ============================================================================
// DEMO ACTIONS
// ============================================================================

/**
 * DEMO 1: Create an Activity with Goals
 */
async function demoCreateActivity(activityIndex = 0) {
  console.log("\n🎬 === DEMO: Creating Activity ===\n");

  const activity = DEMO_CONFIG.ACTIVITIES[activityIndex];

  try {
    // Step 1: Click "Add Activity" button
    console.log("📍 Step 1: Opening activity dialog...");
    const addClicked = await clickButtonByText("Add Activity", "Add Activity Button");
    if (!addClicked) return false;
    await wait(DEMO_CONFIG.PAUSE_MEDIUM);

    // Step 2: Fill in Title
    console.log("📍 Step 2: Entering title...");
    await typeIntoField('input[id="title"]', activity.title);
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 3: Fill in Subject
    console.log("📍 Step 3: Entering subject...");
    await typeIntoField('input[id="subject"]', activity.subject);
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 4: Set Duration
    console.log("📍 Step 4: Setting duration...");
    await typeIntoField('input[id="duration"]', activity.duration.toString());
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 5: Select Priority
    console.log("📍 Step 5: Selecting priority...");
    await clickElement('[id="priority"]', "Priority dropdown");
    await wait(300);
    const priorityOption = Array.from(
      document.querySelectorAll('[role="option"]')
    ).find((opt) => opt.getAttribute("data-value") === activity.priority);
    if (priorityOption) {
      priorityOption.click();
      console.log(`✅ Selected priority: ${activity.priority}`);
    }
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 6: Scroll to Goal Tracking section
    console.log("📍 Step 6: Scrolling to goals section...");
    const dialogContent = document.querySelector('[role="dialog"]');
    if (dialogContent) {
      dialogContent.scrollTop = dialogContent.scrollHeight / 2;
    }
    await wait(DEMO_CONFIG.PAUSE_MEDIUM);

    // Step 7: Select Goal Type
    console.log("📍 Step 7: Setting goal type...");
    await clickElement('[id="goalType"]', "Goal Type dropdown");
    await wait(300);
    const goalOption = Array.from(
      document.querySelectorAll('[role="option"]')
    ).find((opt) => opt.getAttribute("data-value") === activity.goalType);
    if (goalOption) {
      goalOption.click();
      console.log(`✅ Selected goal type: ${activity.goalType}`);
    }
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 8: Set Goal Target
    console.log("📍 Step 8: Setting goal target...");
    await typeIntoField('input[id="goalTarget"]', activity.goalTarget.toString());
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 9: Enable Email Reminders
    if (activity.goalReminders) {
      console.log("📍 Step 9: Enabling email reminders...");
      await clickElement('input[id="goalReminders"]', "Email Reminders Checkbox");
      await wait(DEMO_CONFIG.PAUSE_SHORT);
    }

    // Step 10: Save Activity
    console.log("📍 Step 10: Saving activity...");
    const saveBtn = findButtonByText("Create") || findButtonByText("Update");
    if (saveBtn) {
      saveBtn.click();
      console.log("✅ Clicked: Save Button");
    } else {
      console.error("❌ Save button not found");
    }

    await wait(DEMO_CONFIG.PAUSE_LONG);

    console.log("✅ Activity created successfully!\n");
    return true;
  } catch (error) {
    console.error("❌ Error creating activity:", error);
    return false;
  }
}

/**
 * DEMO 2: Start Pomodoro Timer
 */
async function demoStartTimer(activityName) {
  console.log("\n🎬 === DEMO: Starting Pomodoro Timer ===\n");

  try {
    // Step 1: Select Activity
    console.log("📍 Step 1: Selecting activity...");
    
    // Find the Select trigger in timer card
    const selectTrigger = document.querySelector(
      '.text-sm.font-medium ~ button[role="combobox"]'
    );
    if (selectTrigger) {
      selectTrigger.click();
      await wait(500);

      if (activityName) {
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        const option = options.find((opt) =>
          opt.textContent?.includes(activityName)
        );
        if (option) {
          option.click();
        }
      } else {
        // Select first option
        const firstOption = document.querySelector('[role="option"]');
        if (firstOption) {
          firstOption.click();
        }
      }
    }

    await wait(DEMO_CONFIG.PAUSE_MEDIUM);

    // Step 2: Click Start Button
    console.log("📍 Step 2: Starting timer...");
    await clickButtonByText("Start", "Start Timer Button");
    await wait(DEMO_CONFIG.PAUSE_LONG);

    console.log("✅ Timer started! Pomodoro is running.\n");
    console.log(
      "💡 TIP: Let it run for 10-20 seconds to show animation, then you can:"
    );
    console.log("   - await demoStopTimer() (keeps progress!)");
    console.log("   - await demoResetTimer() (starts over)");

    return true;
  } catch (error) {
    console.error("❌ Error starting timer:", error);
    return false;
  }
}

/**
 * DEMO 2b: Stop Timer (Keeps Progress!)
 */
async function demoStopTimer() {
  console.log("\n⏹️  Stopping timer...");
  // The stop button has a Square icon
  const stopBtn = Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.querySelector('svg.lucide-square')
  );
  if (stopBtn) {
    stopBtn.click();
    console.log("✅ Timer stopped\n");
  }
  await wait(DEMO_CONFIG.PAUSE_SHORT);
  return true;
}

/**
 * DEMO 2c: Reset Timer (Starts Over)
 */
async function demoResetTimer() {
  console.log("\n🔄 Resetting timer (starting fresh)...");
  // The reset button has a RotateCcw icon
  const resetBtn = Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.querySelector('svg.lucide-rotate-ccw')
  );
  if (resetBtn) {
    resetBtn.click();
    console.log("✅ Timer reset to beginning\n");
  } else {
    console.log("⚠️ Reset button not visible (timer might be at start already)\n");
  }
  await wait(DEMO_CONFIG.PAUSE_SHORT);
  return true;
}

/**
 * DEMO 3: Generate AI Flashcards
 */
async function demoGenerateFlashcards(subjectIndex = 0) {
  console.log("\n🎬 === DEMO: Generating AI Flashcards ===\n");

  const flashcardData = DEMO_CONFIG.FLASHCARD_SUBJECTS[subjectIndex];

  try {
    // Step 1: Scroll to flashcard section (if not visible)
    console.log("📍 Step 1: Finding flashcard generator...");
    const flashcardSection = document.querySelector(
      '[data-testid="flashcard-generator"]'
    );
    if (flashcardSection) {
      flashcardSection.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(DEMO_CONFIG.PAUSE_SHORT);
    }

    // Step 2: Type subject
    console.log("📍 Step 2: Entering subject...");
    // Find the input in flashcard generator (it's the only visible input in that section)
    const subjectInput = document.querySelector(
      'input[type="text"][placeholder*="ubject"], input[type="text"][placeholder*="topic"]'
    );
    if (subjectInput) {
      await typeIntoField(
        'input[type="text"][placeholder*="ubject"], input[type="text"][placeholder*="topic"]',
        flashcardData.subject,
        100
      );
    }
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 3: Adjust difficulty slider
    console.log("📍 Step 3: Setting difficulty...");
    const sliders = document.querySelectorAll('input[type="range"]');
    if (sliders.length > 0) {
      const slider = sliders[0];
      slider.value = flashcardData.difficulty.toString();
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
      console.log("✅ Slider set to:", flashcardData.difficulty);
    } else {
      console.log("⚠️ Slider not found, skipping...");
    }
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Step 4: Click Generate
    console.log("📍 Step 4: Generating flashcards...");
    // Look for button with Sparkles icon (the generate button)
    const generateBtn = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.querySelector('svg.lucide-sparkles')
    );
    if (generateBtn) {
      generateBtn.click();
      console.log("✅ Clicked: Generate Button");
    } else {
      console.error("❌ Generate button not found");
      return false;
    }

    await wait(500);
    console.log("⏳ Waiting for AI to generate flashcards (5-10 seconds)...");
    await wait(DEMO_CONFIG.PAUSE_LONG * 2);

    console.log("✅ Flashcards generated!\n");
    console.log("💡 TIP: Now you can:");
    console.log(
      "   - await demoAnswerFlashcards() to automatically answer them"
    );

    return true;
  } catch (error) {
    console.error("❌ Error generating flashcards:", error);
    return false;
  }
}

/**
 * DEMO 4: Answer Flashcards Automatically
 */
async function demoAnswerFlashcards() {
  console.log("\n🎬 === DEMO: Answering Flashcards ===\n");

  try {
    // Find all flashcard containers
    const flashcards = document.querySelectorAll('[data-testid="flashcard"]');

    if (flashcards.length === 0) {
      console.error(
        "❌ No flashcards found. Generate them first with demoGenerateFlashcards()"
      );
      return false;
    }

    console.log(`📍 Found ${flashcards.length} flashcards to answer`);

    for (let i = 0; i < flashcards.length; i++) {
      console.log(`\n📝 Flashcard ${i + 1}/${flashcards.length}:`);

      const card = flashcards[i];

      // Step 1: Click to flip card
      console.log("  ↻ Flipping card...");
      card.click();
      await wait(DEMO_CONFIG.PAUSE_MEDIUM);

      // Step 2: Randomly answer (70% correct, 30% incorrect for realism)
      const isCorrect = Math.random() > 0.3;

      // Find buttons within the card (they should be visible after flipping)
      await wait(500); // Wait for flip animation
      const cardButtons = Array.from(card.querySelectorAll("button"));
      const answerButton = cardButtons.find((btn) => {
        const text = (btn.textContent || "").toLowerCase();
        if (isCorrect) {
          return text.includes("correct") || text.includes("correto") || text.includes("✓");
        } else {
          return text.includes("incorrect") || text.includes("incorreto") || text.includes("✗");
        }
      });

      if (answerButton) {
        console.log(
          `  ✓ Answering: ${isCorrect ? "CORRECT ✅" : "INCORRECT ❌"}`
        );
        answerButton.click();
        await wait(DEMO_CONFIG.PAUSE_MEDIUM);
      }
    }

    console.log("\n✅ All flashcards answered! Session auto-saved.\n");
    return true;
  } catch (error) {
    console.error("❌ Error answering flashcards:", error);
    return false;
  }
}

/**
 * DEMO 5: Navigate to Reports
 */
async function demoNavigateToReports() {
  console.log("\n🎬 === DEMO: Navigating to Reports ===\n");

  try {
    console.log("📍 Clicking Reports link...");
    // Reports link should be in sidebar navigation
    const links = Array.from(document.querySelectorAll("a[href*='/dashboard/reports']"));
    if (links.length > 0) {
      links[0].click();
      await wait(DEMO_CONFIG.PAUSE_LONG);
      console.log("✅ Reports page loaded!\n");
      return true;
    } else {
      console.error("❌ Reports link not found");
      return false;
    }
  } catch (error) {
    console.error("❌ Error navigating to reports:", error);
    return false;
  }
}

/**
 * DEMO 6: Navigate to Settings
 */
async function demoNavigateToSettings() {
  console.log("\n🎬 === DEMO: Navigating to Settings ===\n");

  try {
    console.log("📍 Clicking Settings link...");
    // Settings link should be in sidebar navigation
    const links = Array.from(document.querySelectorAll("a[href*='/dashboard/settings']"));
    if (links.length > 0) {
      links[0].click();
      await wait(DEMO_CONFIG.PAUSE_LONG);
      console.log("✅ Settings page loaded!\n");
      return true;
    } else {
      console.error("❌ Settings link not found");
      return false;
    }
  } catch (error) {
    console.error("❌ Error navigating to settings:", error);
    return false;
  }
}

/**
 * DEMO 7: Toggle Theme
 */
async function demoToggleTheme() {
  console.log("\n🎬 === DEMO: Toggling Theme ===\n");

  try {
    // Click user menu
    console.log("📍 Opening user menu...");
    await clickElement(
      '[data-testid="user-menu"], button[aria-label*="User"]',
      "User Menu"
    );
    await wait(DEMO_CONFIG.PAUSE_SHORT);

    // Click theme toggle
    console.log("📍 Toggling theme...");
    const themeButtons = Array.from(document.querySelectorAll("button"));
    const themeButton = themeButtons.find(
      (btn) =>
        btn.textContent?.includes("Light") ||
        btn.textContent?.includes("Dark") ||
        btn.querySelector("svg") // Theme icon
    );

    if (themeButton) {
      themeButton.click();
      await wait(DEMO_CONFIG.PAUSE_MEDIUM);
      console.log("✅ Theme toggled!\n");
      return true;
    }

    console.log("⚠️ Theme toggle not found in menu");
    return false;
  } catch (error) {
    console.error("❌ Error toggling theme:", error);
    return false;
  }
}

// ============================================================================
// FULL DEMO SEQUENCE
// ============================================================================

/**
 * Run complete demo sequence
 * This runs through all major features automatically
 */
async function runFullDemo() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║           🎓 STUDIFY - FULL DEMO AUTOMATION 🎓             ║");
  console.log("║                                                            ║");
  console.log("║   This will automatically demonstrate all features         ║");
  console.log("║   Duration: ~3-4 minutes                                   ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  try {
    // Phase 1: Create Activities
    console.log("🔵 PHASE 1: Creating Activities (1 min)");
    await demoCreateActivity(0);
    await wait(2000);
    await demoCreateActivity(1);
    await wait(2000);

    // Phase 2: Start Timer
    console.log("\n🔵 PHASE 2: Pomodoro Timer Demo (20 sec)");
    await demoStartTimer();
    await wait(10000); // Let timer run for 10 seconds
    await demoStopTimer(); // Stop but keep progress
    await wait(2000);
    console.log("💡 Timer stopped but progress saved - like Duolingo! 🔥");

    // Phase 3: Flashcards
    console.log("\n🔵 PHASE 3: AI Flashcards Demo (1.5 min)");
    await demoGenerateFlashcards(0);
    await wait(8000); // Wait for generation
    await demoAnswerFlashcards();

    // Phase 4: Navigation
    console.log("\n🔵 PHASE 4: Reports & Settings (30 sec)");
    await demoNavigateToReports();
    await wait(3000);
    await demoNavigateToSettings();
    await wait(2000);

    // Phase 5: Theme Toggle
    console.log("\n🔵 PHASE 5: Theme Toggle");
    await demoToggleTheme();

    console.log("\n");
    console.log(
      "╔════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║                                                            ║"
    );
    console.log(
      "║              ✅ DEMO COMPLETED SUCCESSFULLY! ✅             ║"
    );
    console.log(
      "║                                                            ║"
    );
    console.log(
      "║   All features demonstrated automatically!                ║"
    );
    console.log(
      "║                                                            ║"
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝"
    );
    console.log("\n");

    return true;
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    console.log("\n💡 TIP: You can still run individual demos:");
    console.log("   - await demoCreateActivity()");
    console.log("   - await demoStartTimer()");
    console.log("   - await demoGenerateFlashcards()");
    return false;
  }
}

// ============================================================================
// CUSTOM DEMO SCENARIOS
// ============================================================================

/**
 * Quick 1-minute demo (for short presentations)
 */
async function runQuickDemo() {
  console.log("\n⚡ === QUICK DEMO (1 min) ===\n");

  await demoCreateActivity(0);
  await wait(2000);
  await demoGenerateFlashcards(0);

  console.log("\n✅ Quick demo complete!\n");
}

/**
 * Flashcards-focused demo (show AI capabilities)
 */
async function runFlashcardsDemo() {
  console.log("\n🃏 === FLASHCARDS DEMO ===\n");

  // Generate in 3 different languages
  await demoGenerateFlashcards(0); // Portuguese
  await wait(8000);
  await demoAnswerFlashcards();
  await wait(2000);

  await demoGenerateFlashcards(1); // English
  await wait(8000);

  console.log("\n✅ Multilingual flashcards demo complete!\n");
}

/**
 * Goals-focused demo (show goal tracking)
 */
async function runGoalsDemo() {
  console.log("\n🎯 === GOALS DEMO ===\n");

  await demoCreateActivity(0); // With daily goal
  await wait(2000);
  await demoCreateActivity(1); // With weekly goal
  await wait(2000);
  await demoNavigateToReports();

  console.log("\n✅ Goals demo complete! Show the progress cards.\n");
}

// ============================================================================
// HELPER COMMANDS & DEBUG TOOLS
// ============================================================================

/**
 * Debug: Show all buttons on the page
 */
function debugShowButtons() {
  console.log("\n🔍 DEBUG: All buttons on page:\n");
  const buttons = Array.from(document.querySelectorAll("button"));
  buttons.forEach((btn, i) => {
    const text = btn.textContent?.trim() || "(no text)";
    const type = btn.type || "(no type)";
    const classes = btn.className || "(no classes)";
    const hasIcon = btn.querySelector("svg") ? "✓ has icon" : "";
    console.log(`${i + 1}. [${type}] "${text}" ${hasIcon}`);
    console.log(`   Classes: ${classes.substring(0, 80)}...`);
  });
}

/**
 * Debug: Show all inputs on the page
 */
function debugShowInputs() {
  console.log("\n🔍 DEBUG: All inputs on page:\n");
  const inputs = Array.from(document.querySelectorAll("input"));
  inputs.forEach((input, i) => {
    const id = input.id || "(no id)";
    const name = input.name || "(no name)";
    const type = input.type || "(no type)";
    const placeholder = input.placeholder || "(no placeholder)";
    console.log(`${i + 1}. [${type}] id="${id}" name="${name}"`);
    console.log(`   Placeholder: "${placeholder}"`);
  });
}

/**
 * Debug: Show current dialog state
 */
function debugShowDialog() {
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    console.log("\n✅ Dialog is OPEN");
    console.log("Dialog inputs:", dialog.querySelectorAll("input").length);
    console.log("Dialog buttons:", dialog.querySelectorAll("button").length);
  } else {
    console.log("\n❌ No dialog currently open");
  }
}

// ============================================================================
// INITIALIZATION MESSAGE
// ============================================================================

console.log("\n");
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║                                                            ║");
console.log("║      🎬 STUDIFY DEMO AUTOMATION v2.0 LOADED! 🎬           ║");
console.log("║                                                            ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("\n📖 AVAILABLE COMMANDS:\n");
console.log("  Full Demos:");
console.log("    await runFullDemo()          - Complete 3-4 min demo");
console.log("    await runQuickDemo()         - Quick 1 min demo");
console.log("    await runFlashcardsDemo()    - AI flashcards focus");
console.log("    await runGoalsDemo()         - Goal tracking focus");
console.log("\n  Individual Actions:");
console.log(
  "    await demoCreateActivity(0)       - Create activity with goals (0, 1, or 2)"
);
console.log("    await demoStartTimer()            - Start pomodoro timer");
console.log("    await demoStopTimer()             - Stop (keeps progress!)");
console.log("    await demoResetTimer()            - Reset (starts over)");
console.log("    await demoGenerateFlashcards(0)   - Generate AI flashcards (0, 1, or 2)");
console.log("    await demoAnswerFlashcards()      - Auto-answer all cards");
console.log("    await demoNavigateToReports()     - Go to reports page");
console.log("    await demoNavigateToSettings()    - Go to settings page");
console.log("    await demoToggleTheme()           - Toggle light/dark theme");
console.log("\n  Debug Tools (if something doesn't work):");
console.log("    debugShowButtons()                - List all buttons on page");
console.log("    debugShowInputs()                 - List all inputs on page");
console.log("    debugShowDialog()                 - Check if dialog is open");
console.log(
  "\n💡 TIP: Make sure you're logged in and on /dashboard before running demos!\n"
);
