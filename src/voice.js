let recognition = null
let isListening = false

export function initVoice(onResult, onError, onEnd) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    onError('Navegador no soporta voz. Usá Chrome o Edge.')
    return null
  }

  recognition = new SpeechRecognition()
  recognition.lang = 'es-AR'
  recognition.continuous = true
  recognition.interimResults = false

  recognition.onresult = (event) => {
    const results = event.results
    // Get all results, not just the last one
    for (let i = results.length - 1; i >= 0; i--) {
      const transcript = results[i][0].transcript.trim()
      if (transcript) {
        console.log('Voice input:', transcript)
        onResult(transcript.toLowerCase())
        break
      }
    }
  }

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error)
    if (event.error === 'no-speech') {
      // Silent - just restart listening
      return
    }
    if (event.error === 'not-allowed') {
      onError('Permiso de micrófono denegado')
    } else {
      onError('Error de voz: ' + event.error)
    }
  }

  recognition.onend = () => {
    isListening = false
    onEnd()
  }

  return recognition
}

export function startListening() {
  if (recognition && !isListening) {
    recognition.start()
    isListening = true
    return true
  }
  return false
}

export function stopListening() {
  if (recognition && isListening) {
    recognition.stop()
    isListening = false
  }
}

export function isVoiceSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

// Parse voice command
// "agregar leche" -> { action: 'add', item: 'leche', category: null }
// "agregar manzanas frutas" -> { action: 'add', item: 'manzana', category: 'frutas' }
export function parseCommand(transcript) {
  // Remove "ok lista" trigger if present (optional)
  let text = transcript
    .replace(/^(ok lista[,]?\s*)/i, '')
    .trim()

  if (!text) return null

  // Detect action
  const addMatch = text.match(/^(?:agregar|agrega|añadir|añade)\s+(.+)$/i)
  const marcarMatch = text.match(/^(?:marcar|marca)\s+(.+)$/i)

  let action = null

  if (addMatch) {
    action = 'add'
    text = addMatch[1]
  } else if (marcarMatch) {
    action = 'mark'
    text = marcarMatch[1]
  } else {
    // Default to add - treat whole text as item name
    action = 'add'
    // text stays as is
  }

  // Extract category from end of text
  const categories = ['frutas', 'verduras', 'carnes', 'lacteos', 'limpieza', 'general', 'otros']
  let category = null

  for (const cat of categories) {
    // Check for category with or without 's' at end
    const pattern = new RegExp(`\\s+${cat}s?$`, 'i')
    if (pattern.test(text)) {
      category = cat === 'verduras' ? 'frutas' : cat
      text = text.replace(pattern, '').trim()
      break
    }
  }

  return {
    action,
    item: text.trim(),
    category
  }
}