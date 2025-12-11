class SoundManager {
  private static audioCache: Map<string, HTMLAudioElement> = new Map();

  static playSound(filename: string, volume: number = 1.0): void {
    // Normalize path to public/sounds directory
    const path = `/sounds/${filename}`;
    
    console.log(`[SoundManager] Requesting to play: ${path}`);

    let audio = this.audioCache.get(filename);
    if (!audio) {
      audio = new Audio(path);
      this.audioCache.set(filename, audio);
    }
    
    // Reset and play
    audio.volume = volume;
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Playback started successfully
          // console.log(`[SoundManager] Playing: ${filename}`);
        })
        .catch((error) => {
          console.warn(`[SoundManager] Playback failed for ${filename}.`, error);
          console.warn("Possible reasons: File missing in 'public/sounds/', browser autoplay policy, or wrong filename casing.");
        });
    }
  }

  static stopSound(filename: string): void {
    console.log(`[SoundManager] Stopping: ${filename}`);
    const audio = this.audioCache.get(filename);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}

export default SoundManager;