// adventureMode.js
import { APIService } from './api.js';

export class AdventureMode {
  constructor(uiManager) {
    this.ui = uiManager;
    this.choiceHistory = [];
    this.scenarioCount = 0;
    this.currentContext = null;
    this.selectedTheme = null;
    this.themes = {
      '1': { 
        name: 'Fantasy', 
        description: 'Dragons, magic, and medieval adventures',
        systemPrompt: 'You are a fantasy storyteller creating a 20-chapter epic tale. Focus on building tension and character development leading to a grand climax.'
      },
      '2': { 
        name: 'Sci-Fi', 
        description: 'Space exploration and futuristic technology',
        systemPrompt: 'You are a sci-fi storyteller creating a 20-chapter space saga. Build suspense and wonder leading to an epic cosmic revelation.'
      },
      '3': { 
        name: 'Mystery', 
        description: 'Detective work and solving crimes',
        systemPrompt: 'You are a mystery writer creating a 20-chapter detective story. Plant clues and build tension towards solving the big case.'
      },
      '4': { 
        name: 'Post-Apocalyptic', 
        description: 'Survival in a harsh, transformed world',
        systemPrompt: 'You are a post-apocalyptic storyteller creating a 20-chapter survival tale. Build hope and resilience leading to a transformative conclusion.'
      },
      '5': { 
        name: 'Historical', 
        description: 'Adventures set in fascinating historical periods',
        systemPrompt: 'You are a historical fiction writer creating a 20-chapter period drama. Build historical intrigue leading to a momentous climax.'
      },
      '6': { 
        name: 'Supernatural', 
        description: 'Modern tales with paranormal elements',
        systemPrompt: 'You are a supernatural fiction writer creating a 20-chapter modern mystery. Build supernatural tension leading to an otherworldly revelation.'
      }
    };
  }

  showThemeMenu() {
    let menuText = "\nChoose your adventure theme:\n";
    for (const [key, theme] of Object.entries(this.themes)) {
      menuText += `${key}. ${theme.name} - ${theme.description}\n`;
    }
    this.ui.appendOutput(menuText);
  }

  isValidTheme(choice) {
    return this.themes.hasOwnProperty(choice);
  }

  setTheme(choice) {
    this.selectedTheme = this.themes[choice];
    return `Starting your ${this.selectedTheme.name} adventure...\nChapter 1/20: The Beginning`;
  }

  async generateStoryPrompt(choice = null) {
    if (!this.selectedTheme) {
      return "Error: Theme not selected";
    }

    let storyPhase = "introduction";
    if (this.scenarioCount > 15) {
      storyPhase = "climax";
    } else if (this.scenarioCount > 10) {
      storyPhase = "rising-action";
    } else if (this.scenarioCount > 5) {
      storyPhase = "development";
    }

    let prompt;
    if (!choice) {
      prompt = `Begin a ${this.selectedTheme.name.toLowerCase()} story. 
      Set up the initial scenario (max 60 words) that introduces the main elements and hints at future developments.
      This is Chapter 1 of 20, so establish the foundations for a longer narrative.
      
      Provide exactly three choices (max 20 words each) that:
      - Set different possible directions for the story
      - Establish character traits or motivations
      - Plant seeds for future developments`;
    } else {
      prompt = `Continue this ${this.selectedTheme.name} story:
      
      Previous scenario: ${this.currentContext.scenario}
      User chose: "${this.currentContext.choices[parseInt(choice) - 1]}"
      Current chapter: ${this.scenarioCount + 1}/20
      Story phase: ${storyPhase}
      
      Write Chapter ${this.scenarioCount + 1} (max 60 words) that:
      1. Follows naturally from their choice
      2. ${storyPhase === "development" ? "Develops plot threads and raises stakes" :
          storyPhase === "rising-action" ? "Intensifies conflicts and builds tension" :
          storyPhase === "climax" ? "Drives toward the story's climax" :
          "Establishes new plot elements"}
      3. Maintains narrative momentum
      
      Then provide exactly three choices that:
      1. Offer meaningful story developments
      2. Consider previous choices and consequences
      3. Lead toward an eventual climax`;
    }

    if (this.scenarioCount === 19) {
      prompt += " These should be final resolution choices that will conclude the story.";
    }

    const response = await APIService.callGPT(prompt, this.selectedTheme.systemPrompt);
    const parsed = this.parseResponse(response);
    this.currentContext = parsed;
    return `Chapter ${this.scenarioCount + 1}/20:\n${response}`;
  }

  parseResponse(response) {
    const lines = response.split('\n');
    let scenario = '';
    let choices = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('1.') || 
          line.trim().startsWith('2.') || 
          line.trim().startsWith('3.')) {
        choices.push(line.trim().substring(2).trim());
      } else if (line.trim() && !line.trim().toLowerCase().startsWith('choice')) {
        scenario += line.trim() + ' ';
      }
    }

    return {
      scenario: scenario.trim(),
      choices: choices
    };
  }

  async provideSummary() {
    const journeyNarrative = this.choiceHistory.map((choice, index) => {
      return `Chapter ${index + 1}: ${this.currentContext?.choices[parseInt(choice) - 1]}`;
    }).join('. ');

    const summaryPrompt = `
      Create a light-hearted, entertaining summary of this ${this.selectedTheme.name} story:
      ${journeyNarrative}
      
      Write a fun recap (max 100 words) that:
      1. Highlights the most interesting moments
      2. Points out any funny coincidences or unexpected turns
      3. Celebrates the epic conclusion
      4. Maybe includes a playful comment about the protagonist's choices
      
      Keep it cheerful and entertaining!
    `;

    return await APIService.callGPT(summaryPrompt, "You are a witty storyteller creating fun, positive story summaries.");
  }

  async handleChoice(choice) {
    if (!this.selectedTheme) {
      if (this.isValidTheme(choice)) {
        const message = this.setTheme(choice);
        this.ui.appendOutput(message);
        const response = await this.generateStoryPrompt();
        this.ui.appendOutput(response);
        return true;
      } else {
        this.ui.appendOutput("Please select a valid theme number.");
        return true;
      }
    }

    this.choiceHistory.push(choice);
    this.scenarioCount++;

    if (this.scenarioCount === 20) {
      this.ui.appendOutput("\nAnd that concludes your adventure! Let me prepare a summary...");
      const summary = await this.provideSummary();
      this.ui.appendOutput("\nYour Story Recap:\n" + summary);
      return false;
    }

    const response = await this.generateStoryPrompt(choice);
    this.ui.appendOutput(response);
    return true;
  }
}