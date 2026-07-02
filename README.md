# TEMPLE — Auditorías IG

Dashboard público (GitHub Pages) + análisis con Claude vía GitHub Actions, sin backend propio. La "memoria" es el propio repo: cada auditoría queda commiteada como JSON en `/data`.

## Cómo funciona el análisis

No se pega contenido crudo ni se suben imágenes. Vos escribís en texto libre cómo ves el perfil ese mes (cuántas veces posteó, cómo está el tono, cómo está la estética, si están las 3 destacadas obligatorias). La IA toma esa lectura y la estructura en el formato de auditoría, aplicando la rúbrica.

## Rúbrica

- **Frecuencia (25 pts)** — mínimo 8 posteos mensuales.
- **Tono y contenido (40 pts)** — se compara contra el KV que la marca envía ese mes (pegás el KV en un campo aparte).
- **Estética visual (25 pts)** — también contra el KV: tipografías, paleta, estilo de imagen.
- **Historias destacadas (10 pts)** — Menú, Horarios y Reservas son obligatorias. Pueden tener más, pero esas tres tienen que estar.
- Aprobación: **80/100**.

La rúbrica completa vive en `.github/scripts/audit.mjs` — se edita ahí si cambia el manual de marca.

## Cómo queda armado

- `index.html` — dashboard público. Lee `/data` sin login. Tiene dos vistas: auditorías del mes, e histórico por bar (para ver la evolución de una cuenta a través de varios meses).
- `.github/workflows/audit.yml` — se dispara desde el dashboard (workflow_dispatch).
- `.github/scripts/audit.mjs` — llama a la API de Anthropic con la rúbrica y guarda el resultado.
- `data/*.json` — un archivo por bar y mes. Es el historial completo.

Los puntajes y comentarios que devuelve la IA son **editables** desde el dashboard (botón "✎ ajustar puntajes" en cada tarjeta). Al guardar, el cambio se commitea directo al repo vía la API de GitHub (no hace falta correr el Action de nuevo).

## Puesta en marcha (una sola vez)

1. **Creá el repo en GitHub** (público, para que el dashboard sea visible sin login) y subí estos archivos.
2. **Activá GitHub Pages**: Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/(root)`.
3. **Cargá el secret de Anthropic**: Settings → Secrets and variables → Actions → New repository secret → `ANTHROPIC_API_KEY`.
4. **Generá tu token personal**: GitHub → Settings de tu usuario → Developer settings → Personal access tokens → Fine-grained tokens.
   - Repository access: solo este repositorio.
   - Permissions → Actions: **Read and write**. Contents: **Read and write** (necesario también para poder editar auditorías desde el dashboard).
5. **Configurá el dashboard**: entrá al link de Pages, apretá ⚙ Config, completá owner/repo (se auto-detectan de la URL) y pegá el token.

## Uso mensual

1. "＋ Cargar auditoría" → elegís bar y mes.
2. Pegás el KV que la marca mandó ese mes (referencia para tono/estética).
3. Escribís tu lectura del perfil en texto libre.
4. "Analizar con IA" → dispara el Action, corre en 1-2 min.
5. Si algún puntaje no te cierra, lo ajustás manualmente desde la tarjeta — queda commiteado con esa edición marcada.

## Bares auditados

casatemple, templebarriochino, templehollywood, templepuertomadero, clubtemple, templecaminito, templemaschwitz, templecatedral, templecordoba, templesalta, templetucuman, templecomodoro, templeriogallegos, templerosario, templesgo.

(templepilar fue dado de baja — si reabre, se agrega al array `BARES` en `index.html`.)

## Sobre integrar la API oficial de Instagram

Se evaluó y por ahora no compensa: requiere que las 15 cuentas sean Business/Creator vinculadas a una Page, pasar App Review de Meta (semanas, sin garantía), y mantenimiento de refresh de tokens. Automatizaría solo el criterio de Frecuencia — historias destacadas no son accesibles por ninguna API oficial, así que ese criterio seguiría siendo manual de todas formas. Vale la pena revisitarlo si la carga manual se vuelve el cuello de botella real.
