/**
 * Speech Recognition Wrapper for Meri Dukaan
 * Uses browser Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * with graceful capability detection and fallback to manual typing.
 */

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

interface ISpeechItem {
  transcript: string;
  confidence: number;
}

interface ISpeechResult {
  [index: number]: ISpeechItem;
  length: number;
  isFinal: boolean;
}

interface ISpeechEvent {
  resultIndex: number;
  results: {
    [index: number]: ISpeechResult;
    length: number;
  };
}

interface ISpeechErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechEvent) => void) | null;
  onerror: ((event: ISpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechConstructor = new () => ISpeechInstance;

interface IWindow extends Window {
  SpeechRecognition?: SpeechConstructor;
  webkitSpeechRecognition?: SpeechConstructor;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export class BrowserSpeechRecognizer {
  private recognition: ISpeechInstance | null = null;
  private isListening: boolean = false;
  private callbacks: SpeechRecognitionCallbacks;

  constructor(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  private initRecognition() {
    if (!isSpeechRecognitionSupported()) return;

    const win = window as unknown as IWindow;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechClass) return;

    try {
      this.recognition = new SpeechClass();
      this.recognition.continuous = false; // Capture one command utterance at a time
      this.recognition.interimResults = true; // Show interim text as user speaks
      this.recognition.lang = 'hi-IN'; // Default to Indian Hindi / Hinglish

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onStart?.();
      };

      this.recognition.onresult = (event: ISpeechEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const transcript = finalTranscript.trim() || interimTranscript.trim();
        const isFinal = Boolean(finalTranscript.trim());
        if (transcript) {
          this.callbacks.onResult?.(transcript, isFinal);
        }
      };

      this.recognition.onerror = (event: ISpeechErrorEvent) => {
        let msg = 'ध्वनि पहचान में त्रुटि हुई (Voice recognition error)';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = 'माइक्रोफ़ोन की अनुमति नहीं है (Microphone permission denied)';
        } else if (event.error === 'no-speech') {
          msg = 'कोई आवाज़ सुनाई नहीं दी (No speech detected. Please speak clearly)';
        } else if (event.error === 'network') {
          msg = 'नेटवर्क त्रुटि (Speech network error. You can type your command below)';
        }
        this.callbacks.onError?.(msg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onEnd?.();
      };
    } catch (err) {
      console.warn('Speech recognition could not be initialized:', err);
      this.recognition = null;
    }
  }

  public setLanguage(lang: 'hi' | 'en') {
    if (this.recognition) {
      this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }

  public start() {
    if (!this.recognition) {
      this.callbacks.onError?.('इस ब्राउज़र में ध्वनि पहचान समर्थित नहीं है (Speech recognition not supported)');
      return;
    }
    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch {
      // Ignore if already stopped
    }
    this.isListening = false;
  }

  public abort() {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch {
      // Ignore
    }
    this.isListening = false;
  }

  public get active(): boolean {
    return this.isListening;
  }
}

