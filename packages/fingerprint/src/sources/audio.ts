import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const AUDIO_KEY = 'audio';

export class AudioSource implements Source {
  public readonly key = AUDIO_KEY;

  /**
   * Renders an audio signal using an `OfflineAudioContext` and returns the resulting `AudioBuffer`.
   *
   * This method attempts to start the rendering process of the audio context, handling cases where
   * the context might be suspended (e.g., due to the page being in the background). It retries up to
   * three times to resume the context when the page is in the foreground. If the context remains
   * suspended after the retries or if the rendering process times out, the promise is rejected with
   * an appropriate error.
   *
   * @param context - The `OfflineAudioContext` used to render the audio signal.
   * @returns A promise that resolves with the rendered `AudioBuffer` or rejects with an error if
   *          the rendering fails.
   *
   * @throws {Error} If the rendering process times out or if the context remains suspended after
   *                 the maximum number of retries.
   */
  private renderAudio(context: OfflineAudioContext): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      context.oncomplete = (event) => resolve(event.renderedBuffer);

      // 3 tries to start the context when the page is in foreground
      let resumeTriesLeft = 3;

      const tryResume = () => {
        void context.startRendering();

        switch (context.state) {
          case 'running':
            // The context has started calculating the audio signal. Start a plain timeout.
            setTimeout(() => reject(new Error('Timeout')), 1000);
            break;
          case 'suspended':
            // Don’t count the tries when the page is in background
            if (!document.hidden) {
              resumeTriesLeft--;
            }
            if (resumeTriesLeft > 0) {
              setTimeout(tryResume, 500); // Retry after a delay
            } else {
              reject(new Error('Suspended'));
            }
            break;
        }
      };

      tryResume();
    });
  }

  public areFingerprintsSimilar(fp1: number, fp2: number, tolerance = 0.0000022) {
    const difference = Math.abs(fp1 - fp2);
    const relativeDifference = difference / Math.max(Math.abs(fp1), Math.abs(fp2));
    return relativeDifference < tolerance;
  }

  public async getFudgeFactor() {
    const context = new OfflineAudioContext(1, 5000, 44100);
    const inputBuffer = context.createBuffer(1, 1, 44100);
    inputBuffer.getChannelData(0)[0] = 1; // to be modified by the browser

    const inputNode = context.createBufferSource();
    inputNode.buffer = inputBuffer;
    inputNode.connect(context.destination);
    inputNode.start();

    const outputBuffer = await this.renderAudio(context);
    return outputBuffer.getChannelData(0)[0]; // modified by the browser ~ 1
  }

  public async getFingerprint() {
    const context = new OfflineAudioContext(1, 5000, 44100);
    const oscillator = context.createOscillator();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 1000;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start();

    const outputBuffer = await this.renderAudio(context);
    const fingerprint = outputBuffer.getChannelData(0).reduce((sum, val) => sum + val, 0);
    oscillator.stop();

    return fingerprint;
  }

  public async collect(): Promise<FingerprintComponentValue> {
    try {
      const [fingerprint, fudgeFactor] = await Promise.all([
        this.getFingerprint(),
        this.getFudgeFactor(),
      ]);

      return {
        fingerprint: fudgeFactor !== 0 ? fingerprint / fudgeFactor : fingerprint,
        // 1 means no modification
        fudgeFactor,
      };
    } catch (error) {
      console.error('Error generating audio fingerprint:', error);
      return undefined;
    }
  }
}
