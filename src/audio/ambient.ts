import { useJourney } from "../app/store";
let context: AudioContext | undefined;
let gain: GainNode | undefined;
let filter: BiquadFilterNode | undefined;
let oscillators: OscillatorNode[] = [];
let noise: AudioBufferSourceNode | undefined;
export async function toggleAmbient() {
  if (!context) {
    context = new AudioContext();
    gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;
    filter.connect(gain);
    [55, 82.41, 110, 164.81].forEach((frequency, i) => {
      const osc = context!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.detune.value = i * 2;
      const voice = context!.createGain();
      voice.gain.value = 0.06;
      osc.connect(voice);
      voice.connect(filter!);
      osc.start();
      oscillators.push(osc);
    });
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 4,
      context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02;
      data[i] = last * 0.18;
    }
    noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(filter);
    noise.start();
  }
  try {
    await context.resume();
    const next = !useJourney.getState().soundOn;
    gain!.gain.setTargetAtTime(next ? 0.45 : 0, context.currentTime, 0.8);
    useJourney.getState().toggleSound();
  } catch {
    /* Keep sound state off when browser declines playback. */
  }
}
export function updateAmbient(p: number) {
  if (context && filter)
    filter.frequency.setTargetAtTime(180 + p * 1800, context.currentTime, 2);
}
export function suspendAmbient() {
  if (context && gain) gain.gain.setTargetAtTime(0, context.currentTime, 0.2);
}
export function resumeAmbient() {
  if (context && gain && useJourney.getState().soundOn)
    gain.gain.setTargetAtTime(0.45, context.currentTime, 0.8);
}
