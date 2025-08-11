import { ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { storage, initializeAnonymousAuth } from './firebase.js';

/**
 * Unified Recording Service - Epic 2.1
 * Implements MP4-first codec strategy with chunked uploads and enhanced UX
 */

// Recording constants
const RECORDING_LIMITS = {
  MAX_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  CHUNK_DURATION: 45 * 1000, // 45 seconds per chunk
  WARNING_TIME: 14 * 60 * 1000, // Warning at 14 minutes
};

// Unified codec strategy - MP4 first for 98% browser compatibility
const CODEC_STRATEGY = {
  audio: [
    'audio/mp4;codecs=mp4a.40.2', // AAC-LC in MP4 - best compatibility
    'audio/mp4', // Fallback MP4
    'audio/webm;codecs=opus', // Legacy fallback
    'audio/webm'
  ],
  video: [
    'video/mp4;codecs=h264', // H.264 in MP4 - best compatibility  
    'video/mp4', // Fallback MP4
    'video/webm;codecs=vp8', // Legacy fallback
    'video/webm'
  ]
};

/**
 * Get the best supported MIME type for recording
 * @param {string} mediaType - 'audio' or 'video'
 * @returns {string} Best supported MIME type
 */
export const getBestSupportedMimeType = (mediaType = 'audio') => {
  const codecs = CODEC_STRATEGY[mediaType];
  
  for (const mimeType of codecs) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log(`Selected codec for ${mediaType}:`, mimeType);
      return mimeType;
    }
  }
  
  // Fallback to default if nothing is supported (shouldn't happen in modern browsers)
  console.warn(`No supported codec found for ${mediaType}, using default`);
  return mediaType === 'video' ? 'video/webm' : 'audio/webm';
};

/**
 * Get user media with enhanced constraints and just-in-time permissions
 * @param {Object} options - Recording options
 * @returns {Promise<MediaStream>} Media stream
 */
export const getEnhancedUserMedia = async (options = { audio: true, video: false }) => {
  try {
    // Enhanced constraints for better quality
    const constraints = {
      audio: options.audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      } : false,
      video: options.video ? {
        width: { ideal: 854, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: 'user' // Front camera for selfie-style recording
      } : false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Lock orientation to portrait for video recording on mobile
    if (options.video && 'screen' in window && 'orientation' in window.screen) {
      try {
        await window.screen.orientation.lock('portrait');
      } catch (err) {
        console.log('Orientation lock not available or failed:', err.message);
      }
    }
    
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Media access denied. Please allow microphone/camera access and try again.');
    } else if (error.name === 'NotFoundError') {
      throw new Error(`No ${options.video ? 'camera' : 'microphone'} found. Please connect the required device and try again.`);
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Your browser does not support media recording.');
    } else if (error.name === 'OverconstrainedError') {
      throw new Error('Camera/microphone constraints could not be satisfied. Please try again.');
    } else {
      throw new Error(`Unable to access ${options.video ? 'camera/microphone' : 'microphone'}. Please check your device settings.`);
    }
  }
};

/**
 * Enhanced chunked recording class
 */
export class ChunkedRecorder {
  constructor(stream, options = {}) {
    this.stream = stream;
    this.options = {
      mediaType: options.mediaType || 'audio',
      maxDuration: options.maxDuration || RECORDING_LIMITS.MAX_DURATION,
      chunkDuration: options.chunkDuration || RECORDING_LIMITS.CHUNK_DURATION,
      ...options
    };
    
    this.chunks = [];
    this.mediaRecorder = null;
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.currentChunk = 0;
    
    // Event handlers
    this.onChunkReady = options.onChunkReady || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.onWarning = options.onWarning || (() => {});
    this.onPauseStateChange = options.onPauseStateChange || (() => {}); // New callback
    
    // Background pause detection
    this.setupBackgroundPauseDetection();
    
    // Duration tracking
    this.durationTimer = null;
  }

  /**
   * Setup background pause detection
   */
  setupBackgroundPauseDetection() {
    this.handleVisibilityChange = () => {
      if (document.hidden && this.isRecording && !this.isPaused) {
        console.log('App backgrounded, auto-pausing recording');
        this.pause();
      }
    };
    
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Start recording with chunked strategy
   */
  async start() {
    try {
      if (this.isRecording) return;

      const mimeType = getBestSupportedMimeType(this.options.mediaType);
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: this.options.mediaType === 'video' ? 1000000 : undefined, // 1 Mbps for video
        audioBitsPerSecond: 128000 // 128 kbps for audio
      });

      this.chunks = [];
      this.currentChunk = 0;
      this.startTime = Date.now();
      this.pausedTime = 0;

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push({
            data: event.data,
            timestamp: Date.now(),
            chunkIndex: this.currentChunk++
          });
          
          // Trigger chunk ready callback for immediate processing
          this.onChunkReady(event.data, this.currentChunk - 1);
          
          // Memory management - remove processed chunks
          if (this.chunks.length > 3) {
            this.chunks = this.chunks.slice(-2); // Keep only last 2 chunks in memory
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.onComplete(this.chunks);
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        this.onError(event.error);
      };

      // Start recording with chunk intervals
      this.mediaRecorder.start(this.options.chunkDuration);
      this.isRecording = true;
      this.isPaused = false;

      // Setup duration tracking and limits
      this.startDurationTracking();
      
    } catch (error) {
      console.error('Error starting chunked recording:', error);
      this.onError(error);
    }
  }

  /**
   * Start duration tracking with limits and warnings
   */
  startDurationTracking() {
    this.durationTimer = setInterval(() => {
      if (!this.isRecording || this.isPaused) return;
      
      const elapsed = Date.now() - this.startTime - this.pausedTime;
      this.onProgress(elapsed);
      
      // Warning at 14 minutes
      if (elapsed >= RECORDING_LIMITS.WARNING_TIME && elapsed < RECORDING_LIMITS.WARNING_TIME + 1000) {
        this.onWarning('Recording will automatically stop in 1 minute.');
      }
      
      // Auto-stop at 15 minutes
      if (elapsed >= RECORDING_LIMITS.MAX_DURATION) {
        console.log('Maximum recording duration reached, stopping automatically');
        this.stop();
      }
    }, 1000);
  }

  /**
   * Pause recording
   */
  pause() {
    if (!this.isRecording || this.isPaused) return;
    
    this.mediaRecorder.pause();
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    
    // Notify component of pause state change
    this.onPauseStateChange(true);
  }

  /**
   * Resume recording
   */
  resume() {
    if (!this.isRecording || !this.isPaused) return;
    
    this.mediaRecorder.resume();
    this.isPaused = false;
    this.pausedTime += Date.now() - this.pauseStartTime;
    
    // Notify component of pause state change
    this.onPauseStateChange(false);
  }

  /**
   * Stop recording
   */
  stop() {
    if (!this.isRecording) return;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    this.cleanup();
  }

  /**
   * Get current recording duration
   */
  getDuration() {
    if (!this.startTime) return 0;
    
    const elapsed = Date.now() - this.startTime - this.pausedTime;
    return elapsed;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Release orientation lock
    if ('screen' in window && 'orientation' in window.screen) {
      try {
        window.screen.orientation.unlock();
      } catch (err) {
        console.log('Orientation unlock failed:', err.message);
      }
    }
  }
}

/**
 * Enhanced chunked upload with retry logic
 * @param {string} sessionId - Session ID
 * @param {Array} chunks - Array of recording chunks
 * @param {Object} options - Upload options
 * @returns {Promise<string>} Upload result
 */
export const uploadChunkedRecording = async (sessionId, chunks, options = {}) => {
  try {
    await initializeAnonymousAuth();
    
    const {
      mediaType = 'audio',
      onProgress = () => {},
      onChunkUploaded = () => {},
      maxRetries = 3
    } = options;

    const timestamp = Date.now();
    const fileExtension = mediaType === 'video' ? 'mp4' : 'm4a';
    const baseFilename = `${sessionId}_${timestamp}`;
    
    // Combine all chunks into final blob
    const allChunksData = chunks.map(chunk => chunk.data);
    const finalBlob = new Blob(allChunksData, { 
      type: getBestSupportedMimeType(mediaType)
    });
    
    const filename = `${baseFilename}.${fileExtension}`;
    const filePath = `recordings/${sessionId}/${filename}`;
    const storageRef = ref(storage, filePath);
    
    const metadata = {
      contentType: getBestSupportedMimeType(mediaType),
      customMetadata: {
        sessionId: sessionId,
        recordingType: mediaType,
        timestamp: timestamp.toString(),
        originalFilename: filename,
        chunkCount: chunks.length.toString(),
        recordingVersion: '2.1' // Epic 2.1 version
      }
    };

    // Upload with retry logic
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const uploadTask = uploadBytesResumable(storageRef, finalBlob, metadata);
        
        return await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(Math.round(progress));
            },
            (error) => {
              console.error(`Upload attempt ${attempt + 1} failed:`, error);
              reject(error);
            },
            () => {
              console.log('Chunked upload completed successfully');
              resolve(filePath);
            }
          );
        });
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          console.log(`Upload attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
    
  } catch (error) {
    console.error('Error in chunked upload:', error);
    throw new Error('Failed to upload recording. Please check your connection and try again.');
  }
};

/**
 * Check enhanced recording support
 * @returns {Object} Support information
 */
export const getRecordingSupport = () => {
  const hasBasicSupport = !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia && 
    window.MediaRecorder
  );
  
  if (!hasBasicSupport) {
    return {
      supported: false,
      audio: false,
      video: false,
      codecs: {},
      message: 'Your browser does not support media recording. Please use a modern browser.'
    };
  }
  
  const audioCodec = getBestSupportedMimeType('audio');
  const videoCodec = getBestSupportedMimeType('video');
  
  return {
    supported: true,
    audio: true,
    video: true,
    codecs: {
      audio: audioCodec,
      video: videoCodec
    },
    mp4Support: audioCodec.includes('mp4') && videoCodec.includes('mp4'),
    message: 'Recording supported with enhanced codecs'
  };
};

/**
 * Create blob from chunks with proper MIME type
 * @param {Array} chunks - Recording chunks
 * @param {string} mediaType - 'audio' or 'video'
 * @returns {Blob} Combined blob
 */
export const createBlobFromChunks = (chunks, mediaType = 'audio') => {
  const chunkData = chunks.map(chunk => chunk.data);
  const mimeType = getBestSupportedMimeType(mediaType);
  return new Blob(chunkData, { type: mimeType });
};