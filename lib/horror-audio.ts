export type HorrorSfx = 'power' | 'ui' | 'evidence' | 'judgement' | 'report' | 'incoming' | 'glitch' | 'unlock' | 'ending';

export type HorrorAudioRig = {
  context: AudioContext;
  master: GainNode;
  drone: GainNode;
  filter: BiquadFilterNode;
  sources: AudioScheduledSourceNode[];
};

function oscillator(
  rig: HorrorAudioRig,
  frequency: number,
  duration: number,
  level: number,
  type: OscillatorType = 'sine',
  delay = 0,
  endFrequency?: number,
) {
  const { context } = rig;
  const start = context.currentTime + delay;
  const node = context.createOscillator();
  const gain = context.createGain();
  node.type = type;
  node.frequency.setValueAtTime(frequency, start);
  if (endFrequency) node.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.025, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  node.connect(gain);
  gain.connect(rig.master);
  node.start(start);
  node.stop(start + duration + 0.02);
}

function noiseBurst(rig: HorrorAudioRig, duration: number, level: number, highpass = 300, delay = 0) {
  const { context } = rig;
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  gain.gain.value = level;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(rig.master);
  source.start(context.currentTime + delay);
}

export function createHorrorAudio(volume: number): HorrorAudioRig {
  const context = new AudioContext();
  const master = context.createGain();
  const drone = context.createGain();
  const filter = context.createBiquadFilter();
  const rig: HorrorAudioRig = { context, master, drone, filter, sources: [] };

  master.gain.value = volume;
  master.connect(context.destination);
  drone.gain.setValueAtTime(0.0001, context.currentTime);
  drone.gain.exponentialRampToValueAtTime(0.72, context.currentTime + 1.8);
  drone.connect(master);
  filter.type = 'lowpass';
  filter.frequency.value = 170;
  filter.Q.value = 3.5;
  filter.connect(drone);

  const low = context.createOscillator();
  const lowGain = context.createGain();
  low.type = 'sine';
  low.frequency.value = 43.65;
  lowGain.gain.value = 0.025;
  low.connect(lowGain);
  lowGain.connect(filter);

  const machine = context.createOscillator();
  const machineGain = context.createGain();
  machine.type = 'triangle';
  machine.frequency.value = 65.2;
  machine.detune.value = -11;
  machineGain.gain.value = 0.008;
  machine.connect(machineGain);
  machineGain.connect(filter);

  const pulse = context.createOscillator();
  const pulseDepth = context.createGain();
  pulse.frequency.value = 0.085;
  pulseDepth.gain.value = 46;
  pulse.connect(pulseDepth);
  pulseDepth.connect(filter.frequency);

  const noiseLength = context.sampleRate * 5;
  const noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let brown = 0;
  for (let index = 0; index < noiseLength; index += 1) {
    brown = (brown + 0.018 * (Math.random() * 2 - 1)) / 1.018;
    noiseData[index] = brown * 2.8;
  }
  const noise = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 240;
  noiseFilter.Q.value = 0.65;
  noiseGain.gain.value = 0.011;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(drone);

  [low, machine, pulse, noise].forEach((source) => { source.start(); rig.sources.push(source); });
  void context.resume().catch(() => undefined);
  return rig;
}

export function setHorrorVolume(rig: HorrorAudioRig, volume: number) {
  rig.master.gain.setTargetAtTime(volume, rig.context.currentTime, 0.05);
}

export function setHorrorIntensity(rig: HorrorAudioRig, anomalyLevel: number) {
  const normalized = Math.max(0, Math.min(10, anomalyLevel));
  rig.filter.frequency.setTargetAtTime(170 + normalized * 13, rig.context.currentTime, 0.8);
  rig.drone.gain.setTargetAtTime(0.72 + normalized * 0.025, rig.context.currentTime, 0.8);
}

export function playHorrorSfx(rig: HorrorAudioRig, sound: HorrorSfx) {
  void rig.context.resume().catch(() => undefined);
  if (sound === 'power') {
    oscillator(rig, 52, 0.7, 0.045, 'sine', 0, 84);
    oscillator(rig, 420, 0.08, 0.025, 'square', 0.18);
  } else if (sound === 'ui') {
    oscillator(rig, 520, 0.045, 0.018, 'square', 0, 410);
  } else if (sound === 'evidence') {
    noiseBurst(rig, 0.045, 0.025, 1200);
    oscillator(rig, 185, 0.09, 0.025, 'triangle', 0, 142);
  } else if (sound === 'judgement') {
    oscillator(rig, 116, 0.24, 0.045, 'sine', 0, 86);
    oscillator(rig, 174, 0.18, 0.018, 'triangle', 0.04, 130);
  } else if (sound === 'report') {
    noiseBurst(rig, 0.12, 0.045, 500);
    oscillator(rig, 76, 0.55, 0.06, 'sine', 0, 48);
  } else if (sound === 'incoming') {
    oscillator(rig, 740, 0.12, 0.028, 'sine');
    oscillator(rig, 554, 0.18, 0.024, 'sine', 0.14);
  } else if (sound === 'glitch') {
    noiseBurst(rig, 0.42, 0.075, 180);
    oscillator(rig, 94, 0.45, 0.06, 'sawtooth', 0, 31);
    oscillator(rig, 1230, 0.09, 0.025, 'square', 0.08, 190);
  } else if (sound === 'unlock') {
    oscillator(rig, 110, 0.8, 0.045, 'sine');
    oscillator(rig, 220, 0.65, 0.035, 'sine', 0.18);
    oscillator(rig, 440, 0.9, 0.025, 'sine', 0.36, 415);
  } else if (sound === 'ending') {
    oscillator(rig, 55, 2.7, 0.055, 'sine', 0, 28);
    oscillator(rig, 82, 2.2, 0.025, 'triangle', 0.25, 41);
  }
}

export function destroyHorrorAudio(rig: HorrorAudioRig) {
  rig.sources.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
  void rig.context.close().catch(() => undefined);
}
