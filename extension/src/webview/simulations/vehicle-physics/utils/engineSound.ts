/**
 * Engine Sound Controller
 * Uses Web Audio API for dynamic pitch and volume control with GSAP smoothing
 */

import { gsap } from 'gsap';

export interface EngineSoundControllerConfig {
  animationDuration: number;
  animationEase: string;
  minVolume: number;
  minPitch: number;
  baseVolume?: number;
}

export class EngineSoundController {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private isPlaying = false;
  private isInitialized = false;
  private needsUserInteraction = false;

  // Current smoothed values
  private currentVolume: number = 0.0;
  private currentPlaybackRate: number = 1.0;

  // GSAP tweens for smooth interpolation
  private volumeTween: ((target: number) => void) | null = null;
  private playbackRateTween: ((target: number) => void) | null = null;

  // Track last update time to throttle source recreations
  private lastPlaybackRateUpdate: number = 0;
  private readonly PLAYBACK_RATE_UPDATE_THROTTLE = 50; // ms

  // Configuration
  private config: EngineSoundControllerConfig;

  constructor(config?: EngineSoundControllerConfig) {
    // Initialize with default config or provided config
    this.config = config || {
      animationDuration: 0.5,
      animationEase: 'power2.out',
      minVolume: 0.5,
      minPitch: 0.8,
      baseVolume: 0.3,
    };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(config: Partial<EngineSoundControllerConfig>): void {
    this.config = { ...this.config, ...config };
    // Recreate tweens if animation settings changed
    if (config.animationDuration || config.animationEase) {
      this.recreateTweens();
    }
  }

  /**
   * Recreate GSAP tweens with current config
   */
  private recreateTweens(): void {
    if (!this.audioContext || !this.gainNode) return;

    // Kill existing tweens
    if (this.volumeTween) {
      this.volumeTween = null;
    }
    if (this.playbackRateTween) {
      this.playbackRateTween = null;
    }

    // Create new tweens with updated config
    this.volumeTween = gsap.quickTo(this, 'currentVolume', {
      duration: this.config.animationDuration,
      ease: this.config.animationEase,
      onUpdate: () => {
        if (this.gainNode) {
          this.gainNode.gain.value = Math.max(
            0,
            Math.min(1, this.currentVolume)
          );
        }
      },
    });

    this.playbackRateTween = gsap.quickTo(this, 'currentPlaybackRate', {
      duration: this.config.animationDuration,
      ease: this.config.animationEase,
      onUpdate: () => {
        this.updatePlaybackRateInternal(this.currentPlaybackRate);
      },
    });
  }

  /**
   * Initialize the audio context and load the audio file
   * Note: AudioContext is created in suspended state to comply with autoplay policy.
   * It will be resumed when play() is called (which should happen after user interaction).
   * @param audioPath - Path to the MP3 file or data URL
   */
  async initialize(audioPath: string): Promise<void> {
    try {
      // Clean up any existing audio context before creating a new one (important for hot reload)
      if (this.audioContext) {
        try {
          await this.audioContext.close();
        } catch (error) {
          // Ignore errors when closing existing context
        }
        this.audioContext = null;
      }

      // Check if AudioContext is supported
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      // Create AudioContext with browser compatibility
      // AudioContext starts in 'suspended' state and requires user gesture to resume
      // This is expected behavior and prevents autoplay policy violations
      this.audioContext = new AudioContextClass();

      // Verify AudioContext was created successfully
      if (!this.audioContext) {
        throw new Error('Failed to create AudioContext');
      }

      // Handle data URLs directly (bypasses CSP restrictions)
      let arrayBuffer: ArrayBuffer;
      if (audioPath.startsWith('data:')) {
        // Decode base64 data URL directly
        const base64Data = audioPath.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // Load audio file via fetch for regular URLs
        const response = await fetch(audioPath);
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.statusText}`);
        }
        arrayBuffer = await response.arrayBuffer();
      }

      // Verify audioContext is still valid before using it
      if (!this.audioContext) {
        throw new Error('AudioContext became null before decoding audio');
      }

      this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Verify audioContext is still valid before creating gain node
      if (!this.audioContext) {
        throw new Error('AudioContext became null after decoding audio');
      }

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      // Initialize GSAP quickTo tweens for smooth interpolation
      this.recreateTweens();

      // Initialize current values
      this.currentVolume = 0.0;
      this.currentPlaybackRate = 1.0;

      // Mark that user interaction is needed since we're not playing immediately
      // AudioContext starts in suspended state and requires user gesture to resume
      this.needsUserInteraction = true;

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing engine sound:', error);
      throw error;
    }
  }

  /**
   * Start playing the engine sound
   * Note: Should be called after user interaction to comply with autoplay policy.
   * The AudioContext will be resumed from suspended state when this is called.
   */
  async play(): Promise<void> {
    if (!this.audioContext || !this.buffer || this.isPlaying) return;

    // Resume audio context if suspended (required for autoplay policy)
    // This is expected when called after user interaction
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        // Audio context resume failed - need user interaction
        console.warn(
          'AudioContext resume failed, will retry on next user interaction:',
          error
        );
        this.needsUserInteraction = true;
        return;
      }
    }

    // Only proceed if audio context is running
    if (this.audioContext.state !== 'running') {
      this.needsUserInteraction = true;
      return;
    }

    try {
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.loop = true;

      if (this.gainNode) {
        this.source.connect(this.gainNode);
      }

      // Set initial volume and playback rate before starting
      this.currentVolume = this.config.minVolume;
      this.currentPlaybackRate = this.config.minPitch;
      if (this.gainNode) {
        this.gainNode.gain.value = this.currentVolume;
      }
      if (this.source) {
        this.source.playbackRate.value = this.currentPlaybackRate;
      }

      this.source.start(0);
      this.isPlaying = true;
      this.needsUserInteraction = false;
    } catch (error) {
      console.error('Error playing engine sound:', error);
      // If autoplay is blocked, mark that we need user interaction
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.needsUserInteraction = true;
      }
    }
  }

  /**
   * Stop playing the engine sound
   */
  stop(): void {
    if (this.source && this.isPlaying) {
      try {
        this.source.stop();
      } catch {
        // Source may already be stopped
      }
      this.source = null;
      this.isPlaying = false;
    }
  }

  /**
   * Pause the engine sound (stops current source)
   */
  pause(): void {
    this.stop();
  }

  /**
   * Set the volume (0.0 to 1.0) with GSAP smoothing
   * @param volume - Volume level between 0.0 and 1.0
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.volumeTween) {
      this.volumeTween(clampedVolume);
    } else {
      // Fallback if tween not initialized
      this.currentVolume = clampedVolume;
      if (this.gainNode) {
        this.gainNode.gain.value = clampedVolume;
      }
    }
  }

  /**
   * Set the playback rate (pitch/speed) (0.5 to 2.0) with GSAP smoothing
   * Note: Changing playback rate requires recreating the source
   * @param rate - Playback rate between 0.5 and 2.0
   */
  setPlaybackRate(rate: number): void {
    const clampedRate = Math.max(0.5, Math.min(2, rate));
    if (this.playbackRateTween) {
      this.playbackRateTween(clampedRate);
    } else {
      // Fallback if tween not initialized
      this.currentPlaybackRate = clampedRate;
      this.updatePlaybackRateInternal(clampedRate);
    }
  }

  /**
   * Internal method to update playback rate (recreates source node)
   * @param rate - Playback rate between 0.5 and 2.0
   */
  private updatePlaybackRateInternal(rate: number): void {
    if (!this.audioContext || !this.buffer || !this.isPlaying) return;

    // Ensure audio context is running before creating sources
    if (this.audioContext.state !== 'running') {
      // Try to resume if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          // Resume failed, skip this update
        });
      }
      return;
    }

    const clampedRate = Math.max(0.5, Math.min(2, rate));

    // Throttle updates to prevent too frequent source recreations
    const now = Date.now();
    if (
      this.source &&
      now - this.lastPlaybackRateUpdate < this.PLAYBACK_RATE_UPDATE_THROTTLE
    ) {
      return;
    }

    // If source exists, check if we need to recreate it
    if (this.source) {
      const currentRate = this.source.playbackRate.value;
      // Only recreate if rate change is significant (avoids unnecessary recreations)
      // Use a larger threshold to prevent too frequent recreations
      if (Math.abs(currentRate - clampedRate) > 0.05) {
        // Create new source first before stopping old one to avoid gaps
        const oldSource = this.source;
        const newSource = this.audioContext.createBufferSource();
        newSource.buffer = this.buffer;
        newSource.loop = true;
        newSource.playbackRate.value = clampedRate;

        if (this.gainNode) {
          newSource.connect(this.gainNode);
        }

        try {
          // Start new source immediately to ensure continuous playback
          const currentTime = this.audioContext.currentTime;
          newSource.start(currentTime);

          // Update source reference immediately
          this.source = newSource;
          this.lastPlaybackRateUpdate = now;

          // Stop old source after a delay to allow smooth transition
          // Both sources will play briefly for seamless audio
          setTimeout(() => {
            if (oldSource && oldSource !== this.source) {
              try {
                oldSource.stop();
              } catch {
                // Source may already be stopped
              }
            }
          }, 50);
        } catch (error) {
          console.error('Error starting sound with rate:', error);
          // If new source failed, restore old source to keep playing
          this.source = oldSource;
        }
      }
      // If rate change is small, no need to recreate
    } else {
      // No source exists but we should be playing - create it
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.loop = true;
      this.source.playbackRate.value = clampedRate;

      if (this.gainNode) {
        this.source.connect(this.gainNode);
      }

      try {
        this.source.start(0);
        this.lastPlaybackRateUpdate = now;
      } catch (error) {
        console.error('Error starting sound with rate:', error);
        this.source = null;
        this.isPlaying = false;
      }
    }
  }

  /**
   * Check if user interaction is needed to start playback
   */
  needsInteraction(): boolean {
    return this.needsUserInteraction;
  }

  /**
   * Try to start playback after user interaction
   */
  async tryPlayAfterInteraction(): Promise<void> {
    if (this.needsUserInteraction && this.isInitialized) {
      this.needsUserInteraction = false;
      await this.play();
    }
  }

  /**
   * Check if the sound is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if the sound is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose of all audio resources
   */
  dispose(): void {
    this.stop();

    // Reset GSAP tweens
    if (this.volumeTween) {
      this.currentVolume = 0.0;
      this.volumeTween = null;
    }

    if (this.playbackRateTween) {
      this.currentPlaybackRate = 1.0;
      this.playbackRateTween = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch((error) => {
        console.error('Error closing audio context:', error);
      });
      this.audioContext = null;
    }

    this.buffer = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.needsUserInteraction = false;
  }
}
