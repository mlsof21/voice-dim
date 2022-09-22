import { AlwaysListening, ISpeechService, sleep } from './common';
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

  private removeActivationPhrase(transcript: string) {
    const [_, newTranscript] = transcript.split(this.activationPhrase);
    return newTranscript;
  }

  recognition: SpeechRecognition = new SpeechRecognition();
  recognizing: boolean = false;
  alwaysListening: boolean = false;
  activationPhrase: string = '';
  actions: Array<{ action: string; duration: number }> = [];

  constructor(options: AlwaysListening) {
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = this.alwaysListening = options.active;
    this.activationPhrase = options.activationPhrase;

    // this.recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
    //   console.error('Error with speech recognition:', e);
    //   if (!this.alwaysListening) this.stopListening();
    //   else {
    //     setTimeout(() => this.startListening(), 2000);
    //   }
    // };

    this.recognition.onresult = async (e: SpeechRecognitionEvent) => {
      const transcriptSpan = document.getElementById('transcript');
      (<HTMLSpanElement>transcriptSpan).innerText = e.results[0][0].transcript;
      if (e.results[0].isFinal) {
        const now = Date.now();
        const fullTranscript = Array.from(e.results).map((res) => Array.from(res).map((alt) => alt.transcript));
        console.log({ fullTranscript });

        var transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
        console.log(`heard "${transcript}" with ${e.results[0][0].confidence} confidence`);
        if (this.alwaysListening) {
          if (transcript.includes(this.activationPhrase)) {
            await parseSpeech(this.removeActivationPhrase(transcript));
          }
        } else {
          await parseSpeech(transcript);
        }

        const duration = Date.now() - now;
        this.actions.unshift({ action: transcript.toLowerCase(), duration });
        if (this.actions.length > 10) {
          this.actions.splice(10, 1);
        }
        console.log('Actions', this.actions);

        if (!this.alwaysListening) {
          this.stopListening();
        }
      }
    };

    if (this.alwaysListening) {
      this.startListening();
    }

    // called when we detect silence
    this.recognition.onspeechend = () => {
      if (this.recognizing && !this.alwaysListening) {
        this.stopListening();
      }
    };
  }
}
