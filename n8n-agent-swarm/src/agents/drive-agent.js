/**
 * Google Drive Agent
 *
 * Permet de:
 * - Chercher des fichiers
 * - Lire des documents
 * - Créer des documents
 * - Modifier des documents
 */

const { google } = require('googleapis');
const axios = require('axios');

class DriveAgent {
  constructor() {
    this.oauth2Client = null;
    this.isAuthenticated = false;
  }

  /**
   * Authentifier avec refresh token
   */
  async authenticate(refreshToken) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    this.isAuthenticated = true;
  }

  /**
   * Échanger code OAuth contre tokens
   */
  async exchangeCodeForTokens(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Chercher des fichiers
   */
  async searchFiles(query, maxResults = 10) {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated. Run /setup first.');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const result = await drive.files.list({
      q: `name contains '${query}' and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size, owners)',
      pageSize: maxResults,
      orderBy: 'modifiedTime desc'
    });

    return result.data.files;
  }

  /**
   * Lire un fichier
   */
  async readFile(fileId) {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    // Get metadata
    const file = await drive.files.get({
      fileId,
      fields: 'name, mimeType, size'
    });

    const mimeType = file.data.mimeType;

    // Si Google Doc/Sheet/Slides, export en texte
    if (mimeType === 'application/vnd.google-apps.document') {
      const content = await drive.files.export({
        fileId,
        mimeType: 'text/plain'
      });

      return {
        name: file.data.name,
        mimeType: 'text/plain',
        content: content.data,
        size: file.data.size
      };
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      const content = await drive.files.export({
        fileId,
        mimeType: 'text/csv'
      });

      return {
        name: file.data.name,
        mimeType: 'text/csv',
        content: content.data,
        size: file.data.size
      };
    } else {
      // Download direct pour autres types
      const content = await drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'text' });

      return {
        name: file.data.name,
        mimeType,
        content: content.data,
        size: file.data.size
      };
    }
  }

  /**
   * Créer un Google Doc
   */
  async createDocument(title, content = '') {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const docs = google.docs({ version: 'v1', auth: this.oauth2Client });

    // Créer doc vide
    const doc = await docs.documents.create({
      requestBody: {
        title
      }
    });

    const documentId = doc.data.documentId;

    // Ajouter contenu si fourni
    if (content) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [{
            insertText: {
              text: content,
              location: { index: 1 }
            }
          }]
        }
      });
    }

    return {
      id: documentId,
      title,
      url: `https://docs.google.com/document/d/${documentId}/edit`
    };
  }

  /**
   * Créer un Google Sheet
   */
  async createSpreadsheet(title, data = []) {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

    // Créer sheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title
        }
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Ajouter données si fournies
    if (data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: data
        }
      });
    }

    return {
      id: spreadsheetId,
      title,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    };
  }

  /**
   * Upload un fichier
   */
  async uploadFile(filename, content, mimeType = 'text/plain') {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const fileMetadata = {
      name: filename
    };

    const media = {
      mimeType,
      body: content
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink'
    });

    return {
      id: file.data.id,
      name: file.data.name,
      url: file.data.webViewLink
    };
  }

  /**
   * Modifier un document
   */
  async updateDocument(fileId, newContent) {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const docs = google.docs({ version: 'v1', auth: this.oauth2Client });

    // Get current content length
    const doc = await docs.documents.get({ documentId: fileId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

    // Delete all content and insert new
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: endIndex - 1
              }
            }
          },
          {
            insertText: {
              text: newContent,
              location: { index: 1 }
            }
          }
        ]
      }
    });

    return {
      id: fileId,
      updated: true,
      url: `https://docs.google.com/document/d/${fileId}/edit`
    };
  }

  /**
   * Partager un fichier
   */
  async shareFile(fileId, email, role = 'reader') {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role, // reader, commenter, writer
        emailAddress: email
      }
    });

    return {
      fileId,
      sharedWith: email,
      role
    };
  }

  /**
   * Liste fichiers récents
   */
  async listRecentFiles(maxResults = 10) {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const result = await drive.files.list({
      q: 'trashed=false',
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
      pageSize: maxResults,
      orderBy: 'modifiedTime desc'
    });

    return result.data.files;
  }

  /**
   * Supprimer un fichier (trash)
   */
  async deleteFile(fileId) {
    if (!this.isAuthenticated) {
      throw new Error('Drive not authenticated');
    }

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    await drive.files.update({
      fileId,
      requestBody: {
        trashed: true
      }
    });

    return {
      fileId,
      deleted: true
    };
  }
}

module.exports = DriveAgent;
