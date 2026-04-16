param(
    [string]$Model = "nomic-embed-text",
    [string]$BaseUrl = "http://localhost:11434"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[Ollama Setup] $Message"
}

function Test-OllamaApi {
    param([string]$Url)
    try {
        $null = Invoke-RestMethod -Uri "$Url/api/tags" -Method Get
        return $true
    } catch {
        return $false
    }
}

function Get-OllamaHostFromBaseUrl {
    param([string]$Url)
    try {
        $uri = [System.Uri]$Url
        if (-not $uri.Port -or $uri.Port -lt 1) {
            return "$($uri.Host):11434"
        }
        return "$($uri.Host):$($uri.Port)"
    } catch {
        return "127.0.0.1:11434"
    }
}

Write-Step "Checking Ollama CLI installation..."
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
$ollamaExe = $null

if ($ollamaCmd) {
    $ollamaExe = $ollamaCmd.Source
} else {
    $defaultOllamaPath = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
    if (Test-Path $defaultOllamaPath) {
        $ollamaExe = $defaultOllamaPath
        Write-Step "Ollama found at default install path: $ollamaExe"
    }
}

if (-not $ollamaExe) {
    Write-Error "Ollama is not installed or not accessible. Install it once from https://ollama.com/download, then rerun this script."
}

Write-Step "Ollama CLI found: $ollamaExe"

$ollamaHost = Get-OllamaHostFromBaseUrl -Url $BaseUrl
$env:OLLAMA_HOST = $ollamaHost
Write-Step "Using OLLAMA_HOST=$ollamaHost"

if (-not (Test-OllamaApi -Url $BaseUrl)) {
    Write-Step "Ollama API is not reachable. Trying to start 'ollama serve' in background..."
    $serveCommand = "$env:OLLAMA_HOST='$ollamaHost'; & '$ollamaExe' serve"
    Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", $serveCommand -WindowStyle Hidden
}

for ($i = 1; $i -le 20; $i++) {
    if (Test-OllamaApi -Url $BaseUrl) {
        break
    }
    Write-Step "Waiting for Ollama API... attempt $i/20"
    Start-Sleep -Seconds 2
}

if (-not (Test-OllamaApi -Url $BaseUrl)) {
    Write-Error "Ollama API still not reachable at $BaseUrl. Open the Ollama desktop app or run 'ollama serve' manually, then rerun this script."
}

Write-Step "Ollama API is reachable at $BaseUrl"

Write-Step "Checking if model '$Model' exists..."
$modelExists = $false
$modelList = & $ollamaExe list 2>$null
foreach ($line in $modelList) {
    if ($line -match "^$Model\b") {
        $modelExists = $true
        break
    }
}

if (-not $modelExists) {
    Write-Step "Model '$Model' not found. Pulling now..."
    & $ollamaExe pull $Model
} else {
    Write-Step "Model '$Model' already exists."
}

Write-Step "Running embedding API smoke test..."
$payload = @{
    model = $Model
    prompt = "I have chest pain and dizziness"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BaseUrl/api/embeddings" -Method Post -ContentType "application/json" -Body $payload

if (-not $response.embedding -or $response.embedding.Count -eq 0) {
    Write-Error "Embedding test failed: empty vector returned."
}

Write-Step "SUCCESS: Ollama is ready for ai-doctor-suggestion-service"
Write-Step "Use these env values in IntelliJ Run Configuration:"
Write-Host "  OLLAMA_BASE_URL=$BaseUrl"
Write-Host "  OLLAMA_EMBEDDING_MODEL=$Model"
