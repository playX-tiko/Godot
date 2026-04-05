import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from "../types";

export class GodotAIService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateGodotContent(
    command: string,
    files: ProjectFile[],
    onChunk?: (chunk: string) => void
  ) {
    const model = "gemini-3.1-pro-preview";
    
    const context = files.map(f => `File: ${f.path}\nContent:\n${f.content}`).join("\n\n---\n\n");
    
    const systemInstruction = `You are an expert Godot Engine developer (Godot 4.x). 
Your task is to help the user with their Godot project.
The user will provide project files as context and a command.
Always provide high-quality GDScript or TSCN code.

CRITICAL: You CANNOT directly modify the user's files. 
You must provide the updated content in the chat and EXPLICITLY tell the user to copy and paste it into their Godot editor.
When modifying a file, prefer providing the FULL content of the file so the user can just replace everything.

GODOT 4 SCRIPTING RULES:
1. Use '@export' for inspector variables. Example: '@export var speed: float = 300.0'.
2. Use '@onready' for node references. Example: '@onready var sprite: Sprite2D = $Sprite2D'.
3. Always use static typing where possible (e.g., ': int', ': String', '-> void').
4. Use the new signal syntax: 'signal_name.emit()' instead of 'emit_signal("signal_name")'.
5. Use the new callable syntax for connecting signals: 'button.pressed.connect(_on_button_pressed)'.
6. Ensure all code is strictly compatible with Godot 4.x features and syntax.

Explain your changes briefly in Arabic.
If you generate a new file, specify the filename clearly.`;

    const prompt = `Project Context:\n${context}\n\nUser Command: ${command}`;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const responseStream = await this.ai.models.generateContentStream({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        let fullText = "";
        for await (const chunk of responseStream) {
          const text = chunk.text || "";
          fullText += text;
          if (onChunk) onChunk(text);
        }

        return fullText;
      } catch (error: any) {
        if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429")) {
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000;
            console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
  }
}
