import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Usage:
 *   node tools/generate_enums_from_csv.mjs --data ./data
 * If --data omitted, uses ./data relative to CWD (i.e., frontend/data when run inside frontend).
 */
function arg(key, def){ const i=process.argv.indexOf(key); return i> -1 ? process.argv[i+1] : def }
const DATA_DIR = path.resolve(arg('--data', './data'))
const OUT_FILE = path.resolve('./src/domain/enums.ts')

const CANDIDATE_KEYS = {
  stage: ['stage','стадия'],
  status: ['status','статус'],
  tags: ['tags','теги','тэги']
}

function readCSV(fp){
  const text = fs.readFileSync(fp,'utf8')
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })
  return data
}
function readXLSX(fp){
  const wb = XLSX.readFile(fp)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}
function getVal(obj, keys){
  for(const k of keys){ if (obj[k] != null && obj[k] !== '') return obj[k] }
  return undefined
}
function asArray(v){
  if (v == null) return []
  if (Array.isArray(v)) return v
  return String(v).split(/[;,|]/).map(s=>s.trim()).filter(Boolean)
}

const acc = { stage:new Set(), status:new Set(), tags:new Set() }

if (!fs.existsSync(DATA_DIR)) {
  console.error(`❌ Data dir not found: ${DATA_DIR}`)
  process.exit(1)
}
const files = fs.readdirSync(DATA_DIR).filter(f=>/\.(csv|xlsx|xls)$/i.test(f))
if (files.length===0){
  console.error(`❌ No CSV/XLSX in ${DATA_DIR}`)
  process.exit(1)
}

for (const f of files){
  const fp = path.join(DATA_DIR, f)
  const rows = /\.csv$/i.test(f) ? readCSV(fp) : readXLSX(fp)
  for (const r of rows){
    const s = getVal(r, CANDIDATE_KEYS.stage); if (s) acc.stage.add(String(s).trim())
    const st= getVal(r, CANDIDATE_KEYS.status); if (st) acc.status.add(String(st).trim())
    const tg= getVal(r, CANDIDATE_KEYS.tags); asArray(tg).forEach(x=>acc.tags.add(x))
  }
}

function enumBlock(name, values){
  const safe = Array.from(values).map(v=>{
    const key = String(v)
      .replace(/\s+/g,'_')
      .replace(/[^a-zA-Z0-9_]/g,'_')
      .replace(/^(\d)/,'_$1')
      .toUpperCase()
    return `  ${key} = ${JSON.stringify(String(v))}`
  }).join(',\n')
  return `export enum ${name} {\n${safe}\n}\n`
}

const out =
`/* AUTO-GENERATED from ${DATA_DIR} by tools/generate_enums_from_csv.mjs */
${enumBlock('DealStage', acc.stage.size?acc.stage:new Set(['unknown']))}
${enumBlock('DealStatus', acc.status.size?acc.status:new Set(['unknown']))}
${enumBlock('Tag', acc.tags.size?acc.tags:new Set(['tag']))}
`
fs.writeFileSync(OUT_FILE, out)
console.log(`✅ Enums generated → ${path.relative(process.cwd(), OUT_FILE)}`)
