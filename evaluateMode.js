// evaluateMode.js
import { APIService } from './api.js';

export class EvaluateMode {
  constructor(uiManager) {
    this.ui = uiManager;
    this.choiceHistory = [];
    this.scenarioCount = 0;
    this.currentScenario = null;
    this.traits = {
      riskTolerance: 0,      // -10 to 10 (conservative to aggressive)
      decisionSpeed: 0,      // -10 to 10 (analytical to impulsive)
      emotionalControl: 0,   // -10 to 10 (emotional to disciplined)
      adaptability: 0,       // -10 to 10 (rigid to flexible)
      confidence: 0          // -10 to 10 (cautious to overconfident)
    };
  }

  async generateScenario(choice = null) {
    let prompt;
    
    if (!choice) {
      prompt = `Start a story with an intriguing scenario (max 60 words) that could lead in multiple directions.
      The initial setting should be simple but with potential for development in various themes (adventure, business, relationships, conflicts).
      Provide exactly three choices that both continue the story and reveal different personality traits.
      Don't make the choices obviously map to personality types.`;
    } else {
      prompt = `Continue the story based on this previous scenario:
      "${this.currentScenario.scenario}"
      
      The user chose: "${this.currentScenario.choices[parseInt(choice) - 1]}"
      
      Create the next story beat (max 60 words) that follows from their choice but potentially shifts the theme or stakes.
      The new scenario should directly acknowledge their previous choice but can introduce unexpected elements or change the context.
      
      Current scenario count: ${this.scenarioCount}/20
      
      Provide exactly three choices that:
      1. Maintain narrative continuity
      2. Allow for character development
      3. Test different personality traits (risk, emotion, decision-making, etc.)
      
      Make the situation feel like a natural but surprising progression from their choice.`;
    }

    if (this.scenarioCount >= 20) {
      prompt += " Include a 4th option: 'I'm ready for my evaluation.'";
    }

    const response = await APIService.callGPT(prompt, 
      "You are a playful but analytical AI creating an engaging story with choices that evaluate human personality traits and trading psychology.");
    
    const parsed = this.parseResponse(response);
    this.currentScenario = parsed;
    return response;
  }

  parseResponse(response) {
    const lines = response.split('\n');
    let scenario = '';
    let choices = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('1.') || 
          line.trim().startsWith('2.') || 
          line.trim().startsWith('3.') ||
          line.trim().startsWith('4.')) {
        choices.push(line.trim().substring(3));
      } else if (line.trim() && !line.trim().toLowerCase().startsWith('choice')) {
        scenario += line.trim() + ' ';
      }
    }

    return {
      scenario: scenario.trim(),
      choices: choices
    };
  }

  async analyzeChoice(choice) {
    const analysisPrompt = `
    Analyze this choice in the context of the story:
    Scenario: "${this.currentScenario.scenario}"
    User's choice: "${this.currentScenario.choices[parseInt(choice) - 1]}"
    
    Based on their decision in this context, score these traits (-10 to +10):
    - Risk Tolerance (conservative vs aggressive)
    - Decision Speed (analytical vs impulsive)
    - Emotional Control (emotional vs disciplined)
    - Adaptability (rigid vs flexible)
    - Confidence (cautious vs overconfident)
    
    Return only the numerical scores in this format:
    Risk: [number]
    Speed: [number]
    Emotion: [number]
    Adapt: [number]
    Confidence: [number]`;

    const analysis = await APIService.callGPT(analysisPrompt);
    this.updateTraits(analysis);
    return analysis;
  }

  updateTraits(analysis) {
    const scores = {
      Risk: /Risk: ([-]?\d+)/,
      Speed: /Speed: ([-]?\d+)/,
      Emotion: /Emotion: ([-]?\d+)/,
      Adapt: /Adapt: ([-]?\d+)/,
      Confidence: /Confidence: ([-]?\d+)/
    };

    for (const [trait, regex] of Object.entries(scores)) {
      const match = analysis.match(regex);
      if (match) {
        const score = parseInt(match[1]);
        const traitKey = trait.toLowerCase() + (
          trait === 'Risk' ? 'Tolerance' : 
          trait === 'Speed' ? 'Speed' : 
          trait === 'Emotion' ? 'Control' : 
          trait === 'Adapt' ? 'ability' : ''
        );
        this.traits[traitKey] = ((this.traits[traitKey] * this.scenarioCount) + score) / (this.scenarioCount + 1);
      }
    }
  }

  async provideSummary() {
    const choicesNarrative = this.choiceHistory.map((choice, index) => {
      return `Decision ${index + 1}: ${this.currentScenario?.choices[parseInt(choice) - 1]}`;
    }).join('. ');

    const summaryPrompt = `
    Based on these trait scores:
    Risk Tolerance: ${this.traits.riskTolerance.toFixed(1)} (-10 conservative to 10 aggressive)
    Decision Speed: ${this.traits.decisionSpeed.toFixed(1)} (-10 analytical to 10 impulsive)
    Emotional Control: ${this.traits.emotionalControl.toFixed(1)} (-10 emotional to 10 disciplined)
    Adaptability: ${this.traits.adaptability.toFixed(1)} (-10 rigid to 10 flexible)
    Confidence: ${this.traits.confidence.toFixed(1)} (-10 cautious to 10 overconfident)

    And their journey: ${choicesNarrative}

    Create a sarcastic, robot-style personality and trading profile analysis (max 100 words).
    Include:
    1. A witty observation about their personality
    2. How this affects their trading style
    3. One brutally honest area for improvement
    4. A sarcastic piece of advice

    Use a detached, robotic tone with subtle mockery. Think GLaDOS from Portal meets a trading psychologist.`;

    return await APIService.callGPT(summaryPrompt, 
      "You are a sarcastic AI personality analyzer specializing in witty, yet insightful psychological observations.");
  }

  async handleChoice(choice) {
    if (choice === "4" && this.scenarioCount >= 20) {
      this.ui.appendOutput("*Calculating personality matrix* ... *Engaging sarcasm protocols* ...");
      const summary = await this.provideSummary();
      this.ui.appendOutput("\nANALYSIS COMPLETE:\n" + summary);
      return false;
    }

    this.ui.appendOutput(`Choice logged. *beep boop*`);
    await this.analyzeChoice(choice);
    this.choiceHistory.push(choice);
    this.scenarioCount++;

    if (this.scenarioCount < 20) {
      const nextScenario = await this.generateScenario(choice);
      this.ui.appendOutput("\nScenario " + (this.scenarioCount + 1) + "/20:\n" + nextScenario);
      return true;
    } else {
      const summary = await this.provideSummary();
      this.ui.appendOutput("\n*Whirring noises*\nFINAL ANALYSIS:\n" + summary);
      return false;
    }
  }
}