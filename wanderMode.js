// wanderMode.js
import { APIService } from './api.js';

export class WanderMode {
  constructor(uiManager) {
    this.ui = uiManager;
    this.choiceHistory = [];
    this.scenarioCount = 0;
    this.currentContext = null;
  }

  async generateStoryPrompt(choice = null) {
    let prompt;
    
    if (!choice) {
      prompt = `Begin a relaxing exploration story in a peaceful meadow with wildflowers. 
      Provide a scenario (max 60 words) and exactly three choices (max 20 words each) that allow the user to explore this environment.
      Each choice should lead to a different aspect or area of this starting location.`;
    } else {
      prompt = `Continue the following exploration story:
      
      Previous scenario: ${this.currentContext.scenario}
      User chose: "${this.currentContext.choices[parseInt(choice) - 1]}"
      
      Write a new scenario (max 60 words) that directly follows from and references the user's choice.
      Then provide exactly three new choices (max 20 words each) that naturally extend from this new situation.
      
      Make sure the new scenario explicitly shows how it follows from their choice, and make each new choice feel like a natural progression.`;
    }

    if (this.scenarioCount >= 10) {
      prompt += " Include a 4th option: 'I'd like to conclude my journey and reflect on the experience'.";
    }

    const response = await APIService.callGPT(prompt);
    const parsed = this.parseResponse(response);
    this.currentContext = parsed;
    return response;
  }

  parseResponse(response) {
    const lines = response.split('\n');
    let scenario = '';
    let choices = [];
    let isCollectingChoices = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('1.')) {
        isCollectingChoices = true;
      }
      
      if (isCollectingChoices) {
        const choiceMatch = trimmedLine.match(/^[1-4]\./);
        if (choiceMatch) {
          choices.push(trimmedLine.substring(2).trim());
        }
      } else if (trimmedLine && !trimmedLine.toLowerCase().startsWith('choice')) {
        scenario += trimmedLine + ' ';
      }
    }

    return {
      scenario: scenario.trim(),
      choices: choices
    };
  }

  async provideSummary() {
    const journeyNarrative = this.choiceHistory.map((choice, index) => {
      return `Step ${index + 1}: ${this.currentContext?.choices[parseInt(choice) - 1]}`;
    }).join('. ');

    const summaryPrompt = `
      Reflect on this wandering journey:
      ${journeyNarrative}
      
      Create two short paragraphs (max 100 words total):
      1. First paragraph: Weave these choices into a flowing narrative that captures the essence of their journey.
      2. Second paragraph: Offer a gentle insight about the motivations and patterns in their exploration choices.
      
      Keep it contemplative and meaningful.
    `;

    return await APIService.callGPT(summaryPrompt, 
      "You are an introspective guide offering gentle insights about exploration patterns and choices.");
  }

  async handleChoice(choice) {
    if (choice === "4" && this.scenarioCount >= 10) {
      this.ui.appendOutput("Let's reflect on your journey so far...");
      const summary = await this.provideSummary();
      this.ui.appendOutput("\nYour Journey:\n" + summary);
      this.ui.appendOutput("\nYou can continue wandering (choose 1-3) or conclude your journey by typing 'exit'.");
      return true; // Keep the story mode active
    }

    this.choiceHistory.push(choice);
    this.scenarioCount++;

    const response = await this.generateStoryPrompt(choice);
    this.ui.appendOutput(response);
    return true;
  }
}
