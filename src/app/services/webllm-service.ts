import { Injectable, signal } from '@angular/core';
import {
  ChatCompletionMessageParam,
  CreateMLCEngine,
  MLCEngine,
  hasModelInCache
} from '@mlc-ai/web-llm';

@Injectable({
  providedIn: 'root',
})
export class WebLLMService {

  // --- State ---
  readonly ready = signal(false);
  readonly progress = signal(0);

  private engine?: MLCEngine;

  // --- Init / Load Model ---
  async loadModel(model: string) {

    this.ready.set(false);
    this.progress.set(0);

    this.engine = await CreateMLCEngine(model, {
      initProgressCallback: ({ progress }) => {
        this.progress.set(progress);
      },
    });

    this.ready.set(true);
  }

  // --- Reset Chat Context ---
  async resetChat() {
    if (!this.engine) throw new Error('Engine not initialized');
    await this.engine.resetChat();
  }

  // --- Streaming Prompt ---
  async *streamChat(messages: ChatCompletionMessageParam[]) {
    if (!this.engine) throw new Error('Engine not initialized');

    const stream = await this.engine.chat.completions.create({
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  // --- Non-Streaming Helper ---
  async runOnce(messages: ChatCompletionMessageParam[]): Promise<string> {
    if (!this.engine) throw new Error('Engine not initialized');

    const res = await this.engine.chat.completions.create({
      messages,
      stream: false,
    });

    return res.choices[0]?.message?.content ?? '';
  }
}
