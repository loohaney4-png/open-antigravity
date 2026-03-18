# Using Free AI with Ollama

Open-Antigravity is now configured to use **Ollama** as the default AI engine - completely free, open-source, and running locally on your machine!

## What is Ollama?

Ollama is a simple tool to download, install, and run large language models locally. It's:
- ✅ **Completely Free** - No API keys, no subscriptions, no costs
- ✅ **Private** - Your data stays on your machine, nothing sent to external servers
- ✅ **Fast** - Optimized for local inference
- ✅ **Easy to Use** - Simple command-line interface

## Quick Start

### 1. Install Ollama

**macOS & Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download/windows

**Docker (if you prefer containers):**
```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### 2. Download a Model

Choose one of these lightweight models:

**Mistral 7B (Recommended - Best balance of speed & quality)**
```bash
ollama pull mistral
```

**Neural Chat 7B (Optimized for conversations)**
```bash
ollama pull neural-chat
```

**Llama 2 7B (Open-source by Meta)**
```bash
ollama pull llama2
```

### 3. Start Ollama

```bash
ollama serve
```

This starts the Ollama server on `http://localhost:11434`

### 4. Run Open-Antigravity

In another terminal:

```bash
# Using Docker Compose
docker-compose up -d

# Or manually
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

### 5. Use the Free AI Agent

Navigate to http://localhost:3000 and start using your free AI agent!

## Available Free Models

### Lightweight Models (Fast, 7B parameters)
```bash
ollama pull mistral        # Fast, capable (Recommended)
ollama pull neural-chat    # Conversational
ollama pull llama2         # Open-source
ollama pull phi            # Ultra-lightweight (smallest)
```

### Larger Models (Slower, but more capable, 13B+ parameters)
```bash
ollama pull llama2:13b      # Llama 2 13B version
ollama pull mistral:13b     # Mistral 13B version
ollama pull dolphin-mixtral # Specialized model
```

## Configuration

### Environment Variables

The default configuration uses Ollama:

```bash
# .env
OLLAMA_ENDPOINT=http://localhost:11434
DEFAULT_MODEL=mistral
```

### Switch Between Models

**Via API:**
```bash
curl -X POST http://localhost:3000/api/models/configure \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "provider": "ollama",
    "modelId": "neural-chat"
  }'
```

**Via CLI:**
```bash
ag config set default-model neural-chat
```

## Hardware Requirements

### Minimum (Basic conversations)
- **GPU:** Not required
- **RAM:** 8GB (for 7B models)
- **Storage:** 5GB per model

### Recommended (Smooth experience)
- **GPU:** 6GB VRAM (NVIDIA/AMD) - massively faster
- **RAM:** 16GB
- **Storage:** 50GB (multiple models)

### Optimal (Best performance)
- **GPU:** 24GB VRAM (like RTX 4090)
- **RAM:** 32GB+
- **Storage:** 100GB+

## GPU Acceleration

For much faster inference, use GPU:

**NVIDIA:**
```bash
# Install CUDA Toolkit
# Then Ollama will automatically use it
ollama pull mistral
ollama serve
```

**Apple Silicon (Mac M1/M2/M3):**
Ollama automatically uses Metal GPU acceleration

**AMD:**
```bash
# Install ROCm, then:
ollama serve  # Will auto-detect
```

## Performance Tips

1. **For slow machines**: Use `phi` or `neural-chat:7b`
2. **For faster responses**: Enable GPU acceleration
3. **Memory pressure**: Reduce `maxTokens` in API calls
4. **Running multiple models**: Keep only 1-2 in memory

## Troubleshooting

### "Ollama server not available"

```bash
# Make sure Ollama is running
ollama serve

# Or with Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
```

### Slow responses

- Check if GPU is being used: `ollama ps`
- Try a smaller model: `ollama pull phi`
- Increase available RAM/VRAM

### Out of memory errors

```bash
# Reduce context size
curl -X POST http://localhost:3000/api/models/generate \
  -d '{
    "modelId": "mistral",
    "maxTokens": 512
  }'
```

### Model not found

```bash
# List installed models
ollama list

# Pull the model
ollama pull mistral
```

## Upgrading Models

Update to newer versions:
```bash
ollama pull mistral:latest
```

Remove old versions:
```bash
ollama rm mistral:old-version
```

## API Endpoints

All standard Open-Antigravity API endpoints work with Ollama:

```bash
# Create an agent with free models
curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Free Code Assistant",
    "role": "code-generator",
    "model": "mistral"
  }'

# Execute with free model
curl -X POST http://localhost:3000/api/agents/agent_id/execute \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "input": "Write a Python function to reverse a string"
  }'

# List free models available
curl http://localhost:3000/api/models/free \
  -H "Authorization: Bearer $JWT"
```

## Optional: Add Paid Models Later

If you want to use premium models alongside Ollama:

```bash
# .env
OLLAMA_ENDPOINT=http://localhost:11434
DEFAULT_MODEL=mistral

# Add paid APIs (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Then use through the API:
```bash
# Mistral (free)
curl -d '{"modelId": "mistral", ...}'

# GPT-4 (paid, optional)
curl -d '{"modelId": "gpt-4-turbo", ...}'
```

## Next Steps

1. Install Ollama: https://ollama.ai
2. Download a model: `ollama pull mistral`
3. Start the server: `ollama serve`
4. Run Open-Antigravity: `docker-compose up`
5. Start building! http://localhost:3000

## Resources

- **Ollama Website**: https://ollama.ai
- **Models Available**: https://ollama.ai/library
- **Community Models**: https://huggingface.co/models?library=ollama
- **Performance Benchmarks**: https://github.com/ollama/ollama#performance

---

**Enjoy free, private, open-source AI!** 🚀

No subscriptions. No API keys. No vendor lock-in.
