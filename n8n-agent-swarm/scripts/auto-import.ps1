# Auto-import workflow into n8n (Windows PowerShell version)
# Usage: .\scripts\auto-import.ps1

$N8N_URL = "http://localhost:5678"
$WORKFLOW_FILE = "n8n-workflows\main-workflow.json"

Write-Host "🚀 n8n Auto-Import Script (Windows)" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Function to wait for n8n to be ready
function Wait-For-N8n {
    Write-Host "⏳ Waiting for n8n to be ready..." -ForegroundColor Yellow

    $maxAttempts = 30
    $attempt = 0

    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "$N8N_URL/healthz" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ n8n is ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            # Ignore errors, keep trying
        }

        $attempt++
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }

    Write-Host "❌ n8n did not start in time" -ForegroundColor Red
    return $false
}

# Function to import workflow
function Import-Workflow {
    Write-Host "`n📥 Importing workflow..." -ForegroundColor Yellow

    if (-not (Test-Path $WORKFLOW_FILE)) {
        Write-Host "❌ Workflow file not found: $WORKFLOW_FILE" -ForegroundColor Red
        return $false
    }

    try {
        $workflowContent = Get-Content $WORKFLOW_FILE -Raw

        $response = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
            -Method POST `
            -ContentType "application/json" `
            -Body $workflowContent `
            -ErrorAction Stop

        $workflowId = $response.id
        Write-Host "✅ Workflow imported successfully! (ID: $workflowId)" -ForegroundColor Green

        # Activate workflow
        Write-Host "🔄 Activating workflow..." -ForegroundColor Yellow
        $activateBody = '{"active": true}' | ConvertTo-Json

        Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$workflowId" `
            -Method PATCH `
            -ContentType "application/json" `
            -Body $activateBody `
            -ErrorAction Stop

        Write-Host "✅ Workflow activated!" -ForegroundColor Green
        return $true

    } catch {
        Write-Host "❌ Failed to import workflow: $_" -ForegroundColor Red
        return $false
    }
}

# Function to open browser
function Open-Browser {
    Write-Host "`n🌐 Opening n8n in browser..." -ForegroundColor Yellow
    Start-Process $N8N_URL
}

# Main execution
Write-Host "Step 1: Checking if n8n is ready..." -ForegroundColor Cyan
if (Wait-For-N8n) {
    Write-Host "`nStep 2: Importing workflow..." -ForegroundColor Cyan
    if (Import-Workflow) {
        Write-Host "`n✨ Setup complete!" -ForegroundColor Green
        Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Configure credentials in n8n UI" -ForegroundColor White
        Write-Host "   2. Add your API keys (Telegram, OpenRouter, OpenAI, Google)" -ForegroundColor White
        Write-Host "   3. Test the workflow by messaging your Telegram bot" -ForegroundColor White

        Open-Browser
    }
} else {
    Write-Host "`n❌ Please make sure n8n is running:" -ForegroundColor Red
    Write-Host "   docker-compose up -d" -ForegroundColor Yellow
}
