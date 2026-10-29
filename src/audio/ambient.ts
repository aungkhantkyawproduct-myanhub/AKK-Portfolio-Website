import { useJourney } from "../app/store";
import { content } from "../content/content";

let context: AudioContext | undefined;
let gain: GainNode | undefined;
let audio: HTMLAudioElement | undefined;
let wanted = false;
let revision = 0;
let pauseTimer: ReturnType<typeof setTimeout> | undefined;
const level = 0.28;

function fade(value: number, seconds: number) {
  if (!context || !gain) return;
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(value, now + seconds);
}
function silence() {
  clearTimeout(pauseTimer);
  fade(0, 0.6);
  pauseTimer = setTimeout(() => audio?.pause(), 650);
}
export async function toggleAmbient() {
  const token = ++revision;
  wanted = !wanted;
  clearTimeout(pauseTimer);
  if (!wanted) {
    useJourney.setState({ soundOn: false });
    silence();
    return;
  }
  try {
    // Everything is created only inside the visitor's explicit sound gesture.
    if (!audio) {
      context = new AudioContext();
      gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      audio = new Audio("/audio/seed-to-scale.mp3");
      audio.preload = "none";
      audio.loop = true;
      context.createMediaElementSource(audio).connect(gain);
    }
    // Invoke both before awaiting, retaining mobile user activation.
    await Promise.all([context!.resume(), audio.play()]);
    if (token !== revision) return;
    if (!wanted) {
      silence();
      return;
    }
    useJourney.setState({ soundOn: true });
    if (document.hidden) {
      silence();
      return;
    }
    fade(level, 1.4);
  } catch {
    if (token !== revision) return;
    wanted = false;
    useJourney.setState({ soundOn: false });
    audio?.pause();
    window.dispatchEvent(
      new CustomEvent("toast", { detail: content.ui.audioUnavailable }),
    );
  }
}
export function suspendAmbient() {
  silence();
}
export async function resumeAmbient() {
  if (!audio || !context || !wanted || !useJourney.getState().soundOn) return;
  const token = revision;
  clearTimeout(pauseTimer);
  try {
    await Promise.all([context.resume(), audio.play()]);
    if (token === revision && wanted && !document.hidden) fade(level, 1.2);
  } catch {
    if (token !== revision) return;
    wanted = false;
    useJourney.setState({ soundOn: false });
    audio.pause();
  }
}
