// ui.js
export class UIManager {
    constructor() {
        this.output = document.getElementById("output");
        this.input = document.getElementById("input");
        this.menuOptions = [
            { id: '1', name: 'Adrift', description: 'Let your mind wander through a relaxing story' },
            { id: '2', name: 'Evaluate', description: 'Analyze your personality through an evolving narrative' },
            { id: '3', name: 'Adventure', description: 'Choose a theme and embark on a unique journey' }
        ];
        this.isGreetingShown = false; // Track if the greeting has been shown
    }

    appendOutput(text) {
        if (!this.output) {
            console.error("Output container is null or undefined.");
            return;
        }

        if (typeof text !== "string" || text.trim() === "") {
            console.error("Invalid text passed to appendOutput:", text);
            return;
        }

        text.split('\n').forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.textContent = line;
            this.output.appendChild(lineDiv);
        });

        requestAnimationFrame(() => {
            const lastChild = this.output.lastElementChild;
            if (lastChild) {
                lastChild.scrollIntoView({ behavior: 'auto' });
            }
        });
    }

    showGreeting() {
        this.appendOutput("Greetings wanderer,\nType 'adrift' to start or 'roadmap' to see what's next.");
        requestAnimationFrame(() => {
          this.focusInput();
        });
    }

    showMenu() {
        let menuText = "Start wandering (1,2,3):\n";
        this.menuOptions.forEach(option => {
            menuText += `${option.id}. ${option.name} - ${option.description}\n`;
        });
        this.appendOutput(menuText);
        this.focusInput();
    }

    showModeIntro(mode) {
        const introMessages = {
            'imagine': "Set your mind adrift... Type 'exit' at anytime to return to the main menu.",
            'evaluate': "*Initializing personality analysis protocols*\nPreparing to evaluate your decision-making patterns...\nType 'exit' at anytime to return to the main menu.",
            'adventure': "Welcome to Adventure Mode!\nPick a theme for your story journey.\nType 'exit' at anytime to return to the main menu."
        };

        this.appendOutput(introMessages[mode] || "Entering new mode...");
    }

    isValidMenuOption(input) {
        return this.menuOptions.some(option => option.id === input);
    }

    getModeName(input) {
        const option = this.menuOptions.find(opt => opt.id === input);
        return option ? option.name.toLowerCase() : null;
    }

    focusInput() {
        if (!this.input.disabled) this.input.focus();
    }

    disableInput() {
        this.input.disabled = true;
    }

    enableInput() {
        this.input.disabled = false;
        this.focusInput();
    }

    clearInput() {
        this.input.value = "";
    }
}
