// api.js
import { CONFIG } from './config.js';

export class APIService {
  static async callGPT(prompt, systemRole = "You are an AI storyteller focusing on relaxing and open-ended exploration stories.") {
    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: CONFIG.model,
          messages: [
            { role: "system", content: systemRole },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('API Error:', error);
      return "Error communicating with the AI. Please try again later.";
    }
  }
}