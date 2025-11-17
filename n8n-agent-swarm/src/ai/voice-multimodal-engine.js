/**
 * Voice & Multimodal AI Engine v2.0
 *
 * Système multimodal complet avec:
 * - Voice-to-Text (Whisper OpenAI)
 * - Text-to-Speech (TTS)
 * - Image Analysis (GPT-4 Vision)
 * - Image Generation (DALL-E 3)
 * - Document Intelligence (OCR, PDF analysis)
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class VoiceMultimodalEngine extends EventEmitter {
  constructor(openaiClient = null, bot = null) {
    super();

    this.openai = openaiClient;
    this.bot = bot;

    // Voice settings
    this.voiceSettings = new Map(); // userId → settings
    this.defaultVoiceSettings = {
      enabled: false,
      voice: 'alloy', // alloy, echo, fable, onyx, nova, shimmer
      speed: 1.0,
      language: 'fr'
    };

    // Transcription cache
    this.transcriptionCache = new Map(); // fileId → transcription

    // Image analysis cache
    this.imageAnalysisCache = new Map(); // imageHash → analysis

    // Statistics
    this.stats = {
      transcriptions: 0,
      ttsGenerated: 0,
      imagesAnalyzed: 0,
      imagesGenerated: 0,
      documentsProcessed: 0
    };

    logger.info('🎤 Voice & Multimodal AI Engine initialized');
  }

  /**
   * Voice-to-Text (Whisper)
   */
  async transcribeVoice(audioFilePath, options = {}) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    try {
      const {
        language = 'fr',
        prompt = null,
        temperature = 0
      } = options;

      // Read audio file
      const audioFile = await fs.readFile(audioFilePath);

      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language,
        prompt,
        temperature,
        response_format: 'verbose_json' // Get timestamps
      });

      this.stats.transcriptions++;

      // Cache result
      const fileId = path.basename(audioFilePath);
      this.transcriptionCache.set(fileId, {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments || [],
        timestamp: Date.now()
      });

      logger.info(`✅ Voice transcribed: ${transcription.text.substring(0, 50)}...`);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments || [],
        words: transcription.words || []
      };

    } catch (error) {
      logger.error('Voice transcription error:', error);
      throw error;
    }
  }

  async transcribeTelegramVoice(voiceMessage) {
    if (!this.bot || !this.openai) {
      throw new Error('Bot or OpenAI not configured');
    }

    try {
      // Download voice file from Telegram
      const fileId = voiceMessage.file_id;
      const file = await this.bot.getFile(fileId);
      const filePath = await this.bot.downloadFile(fileId, '/tmp');

      // Transcribe
      const result = await this.transcribeVoice(filePath);

      // Clean up temp file
      await fs.unlink(filePath).catch(() => {});

      return result;

    } catch (error) {
      logger.error('Telegram voice transcription error:', error);
      throw error;
    }
  }

  /**
   * Text-to-Speech
   */
  async generateSpeech(text, options = {}) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    try {
      const {
        voice = 'alloy', // alloy, echo, fable, onyx, nova, shimmer
        speed = 1.0,
        model = 'tts-1' // tts-1 or tts-1-hd
      } = options;

      const mp3 = await this.openai.audio.speech.create({
        model,
        voice,
        input: text,
        speed
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      this.stats.ttsGenerated++;

      logger.info(`🔊 TTS generated: ${text.substring(0, 50)}...`);

      return buffer;

    } catch (error) {
      logger.error('TTS generation error:', error);
      throw error;
    }
  }

  async sendVoiceReply(chatId, text, userId = null) {
    if (!this.bot) {
      throw new Error('Bot not configured');
    }

    // Check if voice mode enabled for user
    const settings = this.getUserVoiceSettings(userId);

    if (!settings.enabled) {
      return null;
    }

    try {
      // Generate speech
      const audioBuffer = await this.generateSpeech(text, {
        voice: settings.voice,
        speed: settings.speed
      });

      // Save temp file
      const tempPath = `/tmp/tts_${Date.now()}.mp3`;
      await fs.writeFile(tempPath, audioBuffer);

      // Send voice message
      await this.bot.sendVoice(chatId, tempPath);

      // Clean up
      await fs.unlink(tempPath).catch(() => {});

      return true;

    } catch (error) {
      logger.error('Voice reply error:', error);
      return false;
    }
  }

  getUserVoiceSettings(userId) {
    return this.voiceSettings.get(userId) || this.defaultVoiceSettings;
  }

  setUserVoiceSettings(userId, settings) {
    const current = this.getUserVoiceSettings(userId);
    const updated = { ...current, ...settings };
    this.voiceSettings.set(userId, updated);
    return updated;
  }

  /**
   * Image Analysis (GPT-4 Vision)
   */
  async analyzeImage(imageUrl, prompt = null) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    try {
      const defaultPrompt = "Analyse cette image en détail. Décris ce que tu vois, les objets, les personnes, les couleurs, l'ambiance, et tout détail pertinent.";

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || defaultPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const analysis = response.choices[0].message.content;

      this.stats.imagesAnalyzed++;

      // Cache result
      const imageHash = this.hashString(imageUrl);
      this.imageAnalysisCache.set(imageHash, {
        analysis,
        prompt: prompt || defaultPrompt,
        timestamp: Date.now()
      });

      logger.info(`👁️ Image analyzed: ${analysis.substring(0, 100)}...`);

      return analysis;

    } catch (error) {
      logger.error('Image analysis error:', error);
      throw error;
    }
  }

  async analyzeTelegramPhoto(photo, prompt = null) {
    if (!this.bot) {
      throw new Error('Bot not configured');
    }

    try {
      // Get largest photo size
      const largestPhoto = photo[photo.length - 1];
      const fileId = largestPhoto.file_id;

      // Get file URL
      const file = await this.bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`;

      // Analyze
      const analysis = await this.analyzeImage(fileUrl, prompt);

      return analysis;

    } catch (error) {
      logger.error('Telegram photo analysis error:', error);
      throw error;
    }
  }

  /**
   * OCR (Extract text from image)
   */
  async extractTextFromImage(imageUrl) {
    const prompt = "Extrais TOUT le texte visible dans cette image. Fournis uniquement le texte extrait, sans commentaire.";

    const text = await this.analyzeImage(imageUrl, prompt);

    return text;
  }

  /**
   * Image Generation (DALL-E 3)
   */
  async generateImage(prompt, options = {}) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    try {
      const {
        size = '1024x1024', // 1024x1024, 1792x1024, 1024x1792
        quality = 'standard', // standard or hd
        style = 'vivid', // vivid or natural
        n = 1
      } = options;

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size,
        quality,
        style,
        n
      });

      this.stats.imagesGenerated++;

      const imageUrl = response.data[0].url;
      const revisedPrompt = response.data[0].revised_prompt;

      logger.info(`🎨 Image generated: ${prompt.substring(0, 50)}...`);

      return {
        url: imageUrl,
        prompt: prompt,
        revisedPrompt: revisedPrompt
      };

    } catch (error) {
      logger.error('Image generation error:', error);
      throw error;
    }
  }

  /**
   * Document Intelligence
   */
  async analyzeDocument(documentUrl, type = 'auto') {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    try {
      let prompt = '';

      switch (type) {
        case 'invoice':
          prompt = `Analyse cette facture et extrais:
- Numéro de facture
- Date
- Montant total
- TVA
- Fournisseur
- Détails des lignes

Fournis le résultat en JSON.`;
          break;

        case 'contract':
          prompt = `Analyse ce contrat et extrais:
- Parties impliquées
- Date de début et fin
- Montant/Prix
- Conditions importantes
- Pénalités
- Clauses de résiliation

Résume les points clés.`;
          break;

        case 'form':
          prompt = `Analyse ce formulaire et extrais tous les champs avec leurs valeurs.`;
          break;

        default:
          prompt = `Analyse ce document et fournis:
1. Type de document
2. Informations principales
3. Résumé du contenu
4. Points importants à noter`;
      }

      const analysis = await this.analyzeImage(documentUrl, prompt);

      this.stats.documentsProcessed++;

      return {
        type,
        analysis,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Document analysis error:', error);
      throw error;
    }
  }

  /**
   * Batch Processing
   */
  async batchAnalyzeImages(imageUrls, prompt = null) {
    const results = [];

    for (const url of imageUrls) {
      try {
        const analysis = await this.analyzeImage(url, prompt);
        results.push({
          url,
          analysis,
          success: true
        });
      } catch (error) {
        results.push({
          url,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  /**
   * Helper Methods
   */
  hashString(str) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(str).digest('hex');
  }

  clearCache() {
    this.transcriptionCache.clear();
    this.imageAnalysisCache.clear();
    logger.info('🧹 Multimodal cache cleared');
  }

  /**
   * Statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: {
        transcriptions: this.transcriptionCache.size,
        imageAnalysis: this.imageAnalysisCache.size
      },
      voiceEnabledUsers: Array.from(this.voiceSettings.values())
        .filter(s => s.enabled).length
    };
  }
}

module.exports = VoiceMultimodalEngine;
