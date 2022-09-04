import { SpeechService as ISpeechService } from './common';
import { parseSpeech } from './dim-voice';

const dimWords = ['dim', 'damn', 'then', 'them'];

const { webkitSpeechRecognition } = window as any;

var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

export class SpeechService implements ISpeechService {
  startSpeech() {
    this.recognizing = true;
    const imageDiv = document.querySelector('.imageContainer');
    const textDiv = document.querySelector('.textContainer');
    (<HTMLDivElement>textDiv).style.display = 'flex';
    try {
      // calling it twice will throw...
      console.log('starting speech recognition');
      imageDiv?.classList.add('pulse');
      this.recognition.start();
    } catch (e) {}
  }

  stopSpeech() {
    console.log('stopping speech recognition');
    const imageDiv = document.querySelector('.imageContainer');
    imageDiv?.classList.remove('pulse');

    this.recognition.stop();
    this.recognizing = false;

    setTimeout(() => {
      const textDiv = document.querySelector('.textContainer');
      const transcript = document.getElementById('transcript');
      (<HTMLDivElement>textDiv).style.display = 'none';
      (<HTMLSpanElement>transcript).innerText = '';
    }, 10000);
  }

  private removeMagicWord(transcript: string) {
    for (const word of dimWords) {
      console.log('checking transcript for', word);
      if (transcript.startsWith(word)) {
        transcript = transcript.replace(word, '');
        break;
      }
    }
    console.log('returning transcript:', transcript);
    return transcript;
  }

  recognition: SpeechRecognition = new SpeechRecognition();
  recognizing: boolean = false;

  constructor() {
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    // this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    this.recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error('Error with speech recognition:', e);
      this.stopSpeech();
    };

    this.recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcriptSpan = document.getElementById('transcript');
      (<HTMLSpanElement>transcriptSpan).innerText = e.results[0][0].transcript;
      if (e.results[0].isFinal) {
        var transcript = e.results[0][0].transcript.toLowerCase();
        console.log({ transcript });
        if (dimWords.some((word) => transcript.startsWith(word))) {
          parseSpeech(this.removeMagicWord(transcript));
          this.stopSpeech();
        } else {
          console.log('no magic word, understood ', transcript);
          parseSpeech(transcript.toLowerCase());
          this.stopSpeech();
        }
      }
    };

    // called when we detect silence
    this.recognition.onspeechend = () => {
      if (this.recognizing) {
        this.stopSpeech();
      }
    };
  }
}
