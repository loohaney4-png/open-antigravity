# Quick Reference: Free AI Setup

## 30-Second Setup

```bash
# 1. Install Ollama (download from https://ollama.ai)
# 2. Get a model
ollama pull mistral

# 3. Run it
ollama serve

# In another terminal:
# 4. Start Open-Antigravity
git clone https://github.com/ishandutta2007/open-antigravity.git
cd open-antigravity
docker-compose up

# 5. Open browser
http://localhost:3000
```

**Done!** You now have a free AI IDE with no API keys. ✅

---

## Popular Free Models

| Model | Speed | Quality | Best For | RAM |
|-------|-------|---------|----------|-----|
| **Mistral** | ⚡ Fast | ⭐⭐⭐⭐ | General coding | 8GB |
| **Neural Chat** | ⚡⚡ Fastest | ⭐⭐⭐ | Chat/Support | 6GB |
| **Llama 2** | ⚡ Fast | ⭐⭐⭐⭐ | General tasks | 8GB |
| **Phi** | ⚡⚡⚡ Instant | ⭐⭐ | Quick replies | 4GB |

**Recommended:** Start with `mistral` (best balance)

## Commands Cheat Sheet

```bash
# Install a model
ollama pull mistral

# List installed models  
ollama list

# Start server (keep running)
ollama serve

# Run a model directly (for testing)
ollama run mistral "Hello"

# Update to latest version
ollama pull mistral:latest

# Remove a model
ollama rm mistral
```

## Using Different Models

**Change default model in `.env`:**
```
DEFAULT_MODEL=neural-chat
OLLAMA_ENDPOINT=http://localhost:11434
```

**Via API:**
```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Agent",
    "model": "neural-chat"
  }'
```

## GPU Acceleration (for better speed)

### NVIDIA (RTX card)
```bash
# Just run Ollama normally - it auto-detects CUDA
ollama serve
```

### Apple Silicon (M1/M2/M3)
```bash
# Metal GPU acceleration works automatically
ollama serve
```

### AMD
```bash
# Install ROCm, then:
ollama serve
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Is Ollama running? Try `ollama serve` |
| "Model not found" | Download it: `ollama pull mistral` |
| "Out of memory" | Use `phi` instead, or reduce `maxTokens` |
| "Slow responses" | Enable GPU or try `neural-chat` |
| "Ollama crashes" | Check RAM available, increase swap space |

## System Requirements

**Minimum (works but slow):**
- 8GB RAM
- Any CPU
- ~5GB free disk

**Recommended (good speed):**
- 16GB RAM
- Modern CPU (i7/Ryzen 7+)
- GPU with 6GB VRAM (optional but great)

**Optimal (best experience):**
- 32GB+ RAM
- Modern GPU (RTX 4090, A100, etc.)
- 100GB+ free disk

## Compare to Paid Services

| Feature | Ollama | OpenAI | Claude | Gemini |
|---------|--------|--------|--------|--------|
| **Cost** | $0 | $0.01/test | $0.015 | $0.075 |
| **Speed** | Instant | Network latency | Network latency | Network latency |
| **Privacy** | 100% local | Sent to OpenAI | Sent to Anthropic | Sent to Google |
| **API Keys** | None | Required | Required | Required |
| **Offline** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Customizable** | ✅ Yes | ❌ No | ❌ No | ❌ No |

## Environment Variables Reference

```bash
# AI Configuration
OLLAMA_ENDPOINT=http://localhost:11434    # Default
DEFAULT_MODEL=mistral                      # Default model ID

# Optional: Add paid services later
OPENAI_API_KEY=sk-...      # (optional)
ANTHROPIC_API_KEY=sk-...   # (optional)

# Application
NODE_ENV=development
LOG_LEVEL=info
PORT=3000
```

## Resources

- 📥 **Download Ollama**: https://ollama.ai
- 📚 **Models Available**: https://ollama.ai/library
- 🚀 **Full Setup Guide**: [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)
- 📖 **Complete Docs**: [SETUP.md](./SETUP.md)

## Getting Help

**Something not working?**

1. Check if Ollama is running: `ollama list`
2. Check logs: `docker-compose logs backend`
3. See troubleshooting: [OLLAMA_SETUP.md#troubleshooting](./OLLAMA_SETUP.md#troubleshooting)

---

**You're all set!** Enjoy your free, private, open-source AI. 🎉
