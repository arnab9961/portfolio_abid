const DIMENSIONS = 768

export async function createEmbedding(text: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT'): Promise<number[] | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(geminiKey)}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        embedContentConfig: { taskType, output_dimensionality: DIMENSIONS },
      }),
    })
    if (!response.ok) throw new Error(`Gemini embedding provider returned ${response.status}.`)
    const vector = (await response.json())?.embedding?.values
    if (!Array.isArray(vector) || vector.length !== DIMENSIONS) {
      const actualDimensions = Array.isArray(vector) ? vector.length : 0
      throw new Error(`Gemini embedding model returned ${actualDimensions} dimensions; use GEMINI_EMBEDDING_MODEL=gemini-embedding-001, which supports ${DIMENSIONS} dimensions.`)
    }
    return vector
  }

  const key = process.env.EMBEDDING_API_KEY
  const model = process.env.EMBEDDING_MODEL
  if (!key || !model) return null
  const response = await fetch(process.env.EMBEDDING_API_URL || 'https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: text }),
  })
  if (!response.ok) throw new Error(`Embedding provider returned ${response.status}.`)
  const vector = (await response.json())?.data?.[0]?.embedding
  if (!Array.isArray(vector) || vector.length !== DIMENSIONS) throw new Error(`Embedding model must return ${DIMENSIONS} dimensions.`)
  return vector
}
