/**
 * 🎤 VOICE AGENT v4.0
 * 
 * Text-to-Speech et Speech-to-Text
 */

const logger = require('../../core/logger/logger');
const OpenAI = require('openai');

class VoiceAgent {
  constructor(config = {}) {
    this.config = config;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.info('🎤 Voice Agent initialisé');
  }

  async textToSpeech(text, options = {}) {
    try {
      const { voice = 'alloy', speed = 1.0 } = options;

      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        speed
      });

      logger.info('✅ Audio généré', { textLength: text.length, voice });

      return {
        success: true,
        audio: mp3,
        duration: Math.ceil(text.length / 15),
        voice,
        text
      };
    } catch (error) {
      logger.error('❌ Erreur TTS', { error: error.message });
      throw error;
    }
  }

  async speechToText(audioFile) {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'fr'
      });

      logger.info('✅ Transcription terminée', { textLength: transcription.text.length });

      return {
        success: true,
        text: transcription.text,
        language: 'fr'
      };
    } catch (error) {
      logger.error('❌ Erreur STT', { error: error.message });
      throw error;
    }
  }

  async translate(audioFile, targetLanguage = 'en') {
    try {
      const translation = await this.openai.audio.translations.create({
        file: audioFile,
        model: 'whisper-1'
      });

      logger.info('✅ Traduction audio terminée', { target: targetLanguage });

      return {
        success: true,
        text: translation.text,
        targetLanguage
      };
    } catch (error) {
      logger.error('❌ Erreur traduction audio', { error: error.message });
      throw error;
    }
  }
}

module.exports = VoiceAgent;
