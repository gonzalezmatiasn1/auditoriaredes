import { mkdirSync, writeFileSync } from "fs";

const BAR = process.env.BAR;
const MES = process.env.MES;
const CONTENIDO = process.env.CONTENIDO;
const KV = process.env.KV || "(no se adjuntó referencia de KV para este mes)";
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!BAR || !MES || !CONTENIDO) {
  console.error("Faltan datos: BAR, MES o CONTENIDO vacíos.");
  process.exit(1);
}
if (!API_KEY) {
  console.error("Falta el secret ANTHROPIC_API_KEY en el repo.");
  process.exit(1);
}

const systemPrompt = `Sos un auditor de redes sociales para TEMPLE, una cadena de bares en Argentina.

IMPORTANTE sobre el input: no vas a recibir posts ni imágenes reales. Vas a recibir la LECTURA CUALITATIVA de la persona que gestiona el trade marketing de TEMPLE, describiendo con sus palabras cómo ve el perfil de Instagram de un bar ese mes. Tu trabajo es tomar esa descripción y estructurarla en el formato de auditoría, aplicando la rúbrica con criterio. No inventes datos que la persona no mencionó: si algo no está descripto, marcalo explícitamente como "no evaluado por falta de información" en el comentario y asigná un puntaje conservador (no 0 automático, pero tampoco el máximo).

Devolvé ÚNICAMENTE un JSON válido, sin texto adicional, sin markdown, sin backticks, con esta estructura exacta:

{
  "puntaje_total": 0,
  "aprobado": false,
  "criterios": {
    "frecuencia": { "puntaje": 0, "max": 25, "comentario": "..." },
    "tono_contenido": { "puntaje": 0, "max": 40, "comentario": "..." },
    "estetica_visual": { "puntaje": 0, "max": 25, "comentario": "..." },
    "historias_destacadas": { "puntaje": 0, "max": 10, "comentario": "..." }
  },
  "plan_de_accion": ["...", "..."]
}

RÚBRICA (manual de marca TEMPLE 2026):

FRECUENCIA (25 pts): el mínimo esperado son 8 posteos mensuales. Si llegó o superó los 8, puntaje pleno o cercano a pleno. Por debajo de 8, el puntaje baja proporcionalmente (ej: 4 posteos ≈ mitad del puntaje). Si la persona no menciona una cantidad, asumí que no llegó al mínimo y dejalo explícito en el comentario.

TONO Y CONTENIDO (40 pts): se evalúa comparando contra el KV (kit visual/copy) que la marca envió ese mes, que se adjunta más abajo. Evaluá si lo que la persona describe está alineado con ese KV: mismo mensaje central, mismo estilo de copy (casual, con CTA, sin repetir estructura, uso de #TempleCerveza, nombre TEMPLE siempre en mayúsculas). Si la persona describe desvíos del KV, penalizá proporcionalmente a la gravedad del desvío.

ESTÉTICA VISUAL (25 pts): también se evalúa contra el KV adjunto — tipografías, paleta, estilo de imagen. Si la persona describe que la estética coincide con el KV, puntaje alto; si describe inconsistencias (tipografía distinta, uso incorrecto del logo, imágenes de baja calidad), penalizá según la cantidad y gravedad de lo descripto.

HISTORIAS DESTACADAS (10 pts): son OBLIGATORIAS tres destacadas puntuales: Menú, Horarios y Reservas. Pueden existir destacadas adicionales, pero esas tres deben estar sí o sí. Si la persona confirma que están las tres, puntaje alto (8-10, según prolijidad si la menciona). Si falta una o más de esas tres, el puntaje baja fuerte (máximo 4/10 si falta al menos una) y el comentario debe nombrar explícitamente cuál falta.

Aprobación: puntaje_total >= 80 sobre 100.

El plan_de_accion debe tener entre 2 y 4 puntos accionables y concretos para el mes siguiente, basados específicamente en lo que la persona describió, priorizados por impacto en el puntaje.

--- KV enviado por la marca para este mes (referencia para tono y estética) ---
${KV}`;

const userPrompt = `Bar auditado: @${BAR}\nMes: ${MES}\n\nLectura del perfil, en palabras de quien audita:\n${CONTENIDO}`;

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  }),
});

if (!res.ok) {
  const errText = await res.text();
  console.error("Error de la API de Anthropic:", res.status, errText);
  process.exit(1);
}

const data = await res.json();
const textBlock = data.content.find((b) => b.type === "text");
let raw = textBlock ? textBlock.text : "{}";
raw = raw.replace(/```json|```/g, "").trim();

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error("No se pudo parsear el JSON devuelto por el modelo:");
  console.error(raw);
  process.exit(1);
}

parsed.bar = BAR;
parsed.mes = MES;
parsed.fecha_auditoria = new Date().toISOString();

mkdirSync("data", { recursive: true });
writeFileSync(`data/${BAR}-${MES}.json`, JSON.stringify(parsed, null, 2));
console.log(`Guardado data/${BAR}-${MES}.json`);
