import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
import { WebLLMService } from './services/webllm-service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly llm = inject(WebLLMService);
  
  prompt = signal('');
  reply = signal('');
  sending = signal(false);

  changePrompt(event: Event) {
    this.prompt.set((event.target as HTMLTextAreaElement).value);
  }

  async ngOnInit() {
    await this.llm.loadModel('Llama-3.2-3B-Instruct-q4f32_1-MLC');
  }

  async submit() {
    const text = this.prompt().trim();
    if (!text || this.sending()) return;

    this.sending.set(true);
    this.reply.set('');

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: text },
    ];

    let out = '';
    for await (const chunk of this.llm.streamChat(messages)) {
      out += chunk;
      this.reply.set(out);
    }

    this.sending.set(false);
    this.prompt.set('');
  }
}
