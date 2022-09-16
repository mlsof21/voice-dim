import { ISpeechService } from './common';
import { parseSpeech } from './voiceDim';

const dimWords = ['dim', 'damn', 'then', 'them'];

const { webkitSpeechRecognition } = window as any;

var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

export class SpeechService implements ISpeechService {
  startListening() {
    this.recognizing = true;
    const imageDiv = document.querySelector('.imageContainer');
    const textDiv = document.querySelector('.textContainer');
    const transcript = document.getElementById('transcript');
    (<HTMLSpanElement>transcript).innerText = '';
    (<HTMLDivElement>textDiv).style.display = 'flex';
    try {
      // calling it twice will throw...
      console.log('started listening');
      imageDiv?.classList.add('pulse');
      this.recognition.start();
    } catch (e) {}
  }

  stopListening() {
    console.log('stopping listening');
    const imageDiv = document.querySelector('.imageContainer');
    imageDiv?.classList.remove('pulse');

    this.recognition.stop();
    this.recognizing = false;

    const transcript = document.getElementById('transcript');

    let timeout = 7000;
    if ((<HTMLSpanElement>transcript).innerText.trim() === '') {
      timeout = 100;
    }
    setTimeout(() => {
      const textDiv = document.querySelector('.textContainer');
      const transcript = document.getElementById('transcript');
      (<HTMLDivElement>textDiv).style.display = 'none';
      (<HTMLSpanElement>transcript).innerText = '';
    }, timeout);
  }

  private removeMagicWord(transcript: string) {
    for (const word of dimWords) {
      if (transcript.startsWith(word)) {
        transcript = transcript.replace(word, '');
        break;
      }
    }
    return transcript;
  }

  recognition: SpeechRecognition = new SpeechRecognition();
  recognizing: boolean = false;
  actions: Array<{ action: string; duration: number }> = [];
  constructor() {
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    // this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    this.recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error('Error with speech recognition:', e);
      this.stopListening();
    };

    this.recognition.onresult = async (e: SpeechRecognitionEvent) => {
      const transcriptSpan = document.getElementById('transcript');
      (<HTMLSpanElement>transcriptSpan).innerText = e.results[0][0].transcript;
      if (e.results[0].isFinal) {
        const now = Date.now();
        var transcript = e.results[0][0].transcript.toLowerCase();
        console.log(`heard "${transcript}" with ${e.results[0][0].confidence} confidence`);

        await parseSpeech(this.removeMagicWord(transcript.toLowerCase()));

        const duration = Date.now() - now;
        this.actions.unshift({ action: transcript.toLowerCase(), duration });
        if (this.actions.length > 10) {
          this.actions.splice(10, 1);
        }
        console.log('Actions', this.actions);

        this.stopListening();
      }
    };

    // called when we detect silence
    this.recognition.onspeechend = () => {
      if (this.recognizing) {
        this.stopListening();
      }
    };
  }
}
