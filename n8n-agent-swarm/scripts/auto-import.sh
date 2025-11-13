#!/bin/bash

###############################################################################
# AUTO-IMPORT WORKFLOW - S'exécute au démarrage de n8n
###############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🚀 n8n Agent Swarm - Auto-Import                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
N8N_HOST="${N8N_HOST:-localhost}"
N8N_PORT="${N8N_PORT:-5678}"
N8N_PROTOCOL="${N8N_PROTOCOL:-http}"
N8N_URL="${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}"
WORKFLOW_FILE="n8n-workflows/main-workflow.json"
MAX_RETRIES=30
RETRY_DELAY=2

echo "🔍 Configuration:"
echo "   URL: $N8N_URL"
echo "   Workflow: $WORKFLOW_FILE"
echo ""

# Fonction d'attente pour n8n
wait_for_n8n() {
    echo "⏳ Attente du démarrage de n8n..."

    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s -o /dev/null -w "%{http_code}" "${N8N_URL}/healthz" | grep -q "200"; then
            echo "✅ n8n est prêt!"
            return 0
        fi

        echo -n "."
        sleep $RETRY_DELAY
    done

    echo ""
    echo "❌ Timeout: n8n n'a pas démarré après $((MAX_RETRIES * RETRY_DELAY)) secondes"
    return 1
}

# Importer le workflow via API
import_workflow() {
    echo ""
    echo "📥 Import du workflow..."

    if [ ! -f "$WORKFLOW_FILE" ]; then
        echo "❌ Fichier non trouvé: $WORKFLOW_FILE"
        return 1
    fi

    # Utiliser l'API n8n pour importer
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d @"$WORKFLOW_FILE" \
        "${N8N_URL}/api/v1/workflows" 2>/dev/null)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Workflow importé avec succès!"

        # Extraire l'ID du workflow
        WORKFLOW_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

        if [ -n "$WORKFLOW_ID" ]; then
            echo "   ID du workflow: $WORKFLOW_ID"
            echo "   URL: ${N8N_URL}/workflow/${WORKFLOW_ID}"

            # Activer automatiquement le workflow
            echo ""
            echo "⚡ Activation du workflow..."

            ACTIVATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
                -X PATCH \
                -H "Content-Type: application/json" \
                -d '{"active": true}' \
                "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" 2>/dev/null)

            ACTIVATE_CODE=$(echo "$ACTIVATE_RESPONSE" | tail -n1)

            if [ "$ACTIVATE_CODE" = "200" ]; then
                echo "✅ Workflow activé!"
            else
                echo "⚠️  Workflow importé mais pas activé (activer manuellement)"
            fi
        fi

        return 0
    else
        echo "❌ Échec de l'import (HTTP $HTTP_CODE)"
        echo "$BODY"
        return 1
    fi
}

# Fonction principale
main() {
    # Attendre que n8n soit prêt
    if ! wait_for_n8n; then
        echo ""
        echo "💡 Solution:"
        echo "   1. Démarrer n8n: docker-compose up -d"
        echo "   2. Relancer ce script: bash $0"
        exit 1
    fi

    # Importer le workflow
    if import_workflow; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║                                                            ║"
        echo "║   ✅ IMPORT RÉUSSI !                                      ║"
        echo "║                                                            ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "🎯 Prochaines étapes:"
        echo ""
        echo "1. Ouvrir n8n: ${N8N_URL}"
        echo ""
        echo "2. Configurer les credentials:"
        echo "   • Telegram Bot Token"
        echo "   • OpenRouter API Key"
        echo "   • OpenAI API Key"
        echo "   • Google OAuth"
        echo ""
        echo "3. Le workflow est déjà activé! ✅"
        echo ""
        echo "4. Tester via Telegram:"
        echo '   "Add a Snapchat agent"'
        echo ""

        # Ouvrir le navigateur si possible
        if command -v xdg-open > /dev/null 2>&1; then
            read -p "Ouvrir n8n dans le navigateur? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                xdg-open "${N8N_URL}"
            fi
        elif command -v open > /dev/null 2>&1; then
            read -p "Ouvrir n8n dans le navigateur? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open "${N8N_URL}"
            fi
        fi

    else
        echo ""
        echo "❌ L'import a échoué"
        echo ""
        echo "💡 Solutions alternatives:"
        echo ""
        echo "1. Import manuel via UI:"
        echo "   • Ouvrir: ${N8N_URL}"
        echo "   • Cliquer '+' → 'Import from File'"
        echo "   • Sélectionner: ${WORKFLOW_FILE}"
        echo ""
        echo "2. Vérifier les logs n8n:"
        echo "   docker-compose logs n8n"
        echo ""
        exit 1
    fi
}

# Exécuter
main
