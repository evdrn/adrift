// app.js
import { UIManager } from './ui.js';
import { WanderMode } from './wanderMode.js';
import { EvaluateMode } from './evaluateMode.js';
import { AdventureMode } from './adventure.js';

class TerminalStory {
    constructor() {
        this.ui = new UIManager();
        this.modes = {
            'adrift': new WanderMode(this.ui),
            'evaluate': new EvaluateMode(this.ui),
            'adventure': new AdventureMode(this.ui)
        };
        this.isMenuDisplayed = false;
        this.inStoryMode = false;
        this.currentMode = null;
        this.isProcessing = false;

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.ui.showGreeting();
        this.ui.focusInput();
    }

    setupEventListeners() {
        this.ui.input.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                const userInput = this.ui.input.value.trim();
        
                if (!userInput || typeof userInput !== "string" || Array.isArray(userInput)) {
                    console.warn("Invalid input received:", userInput);
                    return;
                }                
        
                this.ui.appendOutput(`> ${userInput}`);
                this.ui.clearInput();
        
                await this.processInput(userInput);
            }
        });        

        document.addEventListener("click", () => this.ui.focusInput());
    }

async processInput(userInput) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.ui.disableInput();

    try {
        if (userInput.toLowerCase() === "roadmap") {
            this.ui.appendOutput(`
Upcoming Updates:
1. Game Adventure Mode
2. Visual AI Generated Elements
3. Developing personalized AI Agents based on Evaluate mode.

Tell us what you want to see on Twitter and Telegram.

Type 'exit' to start imagining again.
            `);
        } else if (userInput.toLowerCase() === "exit") {
            this.handleExit();
        } else if (userInput.toLowerCase() === "settings") {
            this.handleSettingsMenu();
        } else if (!this.isMenuDisplayed) {
            this.handleInitialInput(userInput);
        } else if (!this.inStoryMode) {
            await this.handleMenuInput(userInput);
        } else {
            await this.handleStoryInput(userInput);
        }
    } finally {
        this.isProcessing = false;
        this.ui.enableInput();
    }
}


    handleExit() {
        this.ui.appendOutput("Returning to the main menu...");
        this.inStoryMode = false;
        this.isMenuDisplayed = false;
        this.currentMode = null;
        this.ui.showMenu();
    }

    handleInitialInput(userInput) {
        if (userInput === "adrift") {
            this.ui.showMenu();
            this.isMenuDisplayed = true;
        } else {
            this.ui.appendOutput("Please type 'adrift' to proceed.");
        }
    }

    async handleMenuInput(userInput) {
        if (!this.ui.isValidMenuOption(userInput)) {
            this.ui.appendOutput(`Unknown command: ${userInput}`);
            return;
        }

        const modeName = this.ui.getModeName(userInput);
        const mode = this.modes[modeName];
        
        if (!mode) {
            this.ui.appendOutput("This mode is currently unavailable. Please try another option.");
            return;
        }

        this.ui.showModeIntro(modeName);
        this.inStoryMode = true;
        this.currentMode = mode;

        if (modeName === 'adventure') {
            mode.showThemeMenu();
        } else {
            const response = await (modeName === 'adrift' ? 
                mode.generateStoryPrompt() : 
                mode.generateScenario());

            if (modeName === 'evaluate') {
                this.ui.appendOutput("\nScenario 1/20:\n" + response);
                mode.scenarioCount = 0;
            } else {
                this.ui.appendOutput(response);
                mode.scenarioCount++;
            }
        }
    }

    async handleStoryInput(userInput) {
        if (!this.currentMode) return;

        if (this.currentMode === this.modes['adventure'] && !this.currentMode.selectedTheme) {
            if (!this.currentMode.isValidTheme(userInput)) {
                this.ui.appendOutput("Please select a valid theme number.");
                return;
            }
        }

        const maxScenarios = this.currentMode === this.modes['evaluate'] ? 20 : 10;
        const validChoice = ["1", "2", "3"].includes(userInput) || 
                        (this.currentMode.scenarioCount >= maxScenarios && userInput === "4") ||
                        (this.currentMode === this.modes['adventure'] && !this.currentMode.selectedTheme);

        if (validChoice) {
            const continueStory = await this.currentMode.handleChoice(userInput);
            if (!continueStory) {
                this.inStoryMode = false;
                this.currentMode = null;
            }
        } else {
            const availableChoices = this.currentMode.scenarioCount >= maxScenarios ? 
                "Please choose a valid option (1, 2, 3, or 4)." :
                "Please choose a valid option (1, 2, or 3).";
            this.ui.appendOutput(availableChoices);
        }
    }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    const output = document.getElementById("output");
    const input = document.getElementById("input");

    // Validate the existence of required DOM elements
    if (!output || !input) {
        console.error("Required DOM elements missing. Please check your HTML structure.");
        return;
    }

    // Initialize the application only if the DOM elements exist
    new TerminalStory();
});

