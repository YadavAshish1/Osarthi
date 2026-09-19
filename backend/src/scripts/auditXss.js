import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const XSS_PATTERNS = [
  { name: '<script> tag', regex: /<script[\s\S]*?>/i },
  { name: '</script> close tag', regex: /<\/script>/i },
  { name: 'javascript: URI', regex: /javascript\s*:/i },
  { name: 'vbscript: URI', regex: /vbscript\s*:/i },
  { name: 'data:text/html URI', regex: /data\s*:\s*text\/html/i },
  { name: 'DOM Event Handler (e.g. onerror=, onload=)', regex: /\bon[a-z]{3,}\s*=/i },
  { name: '<iframe> tag', regex: /<iframe[\s\S]*?>/i },
  { name: '<object>/<embed> tag', regex: /<(object|embed)[\s\S]*?>/i },
  { name: 'SVG with onload/onerror', regex: /<svg[\s\S]*?on\w+\s*=/i },
  { name: 'IMG with onerror/onload', regex: /<img[\s\S]*?on\w+\s*=/i },
  { name: 'document.cookie / location access', regex: /document\.(cookie|domain)/i },
  { name: 'eval() execution', regex: /\beval\s*\(/i },
];

function scanValue(val, pathStr, findings, docId) {
  if (val === null || val === undefined) return;

  if (typeof val === 'string') {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.regex.test(val)) {
        findings.push({
          docId,
          path: pathStr,
          threat: pattern.name,
          preview: val.length > 150 ? val.substring(0, 150) + '...' : val,
        });
      }
    }
  } else if (Array.isArray(val)) {
    val.forEach((item, index) => scanValue(item, `${pathStr}[${index}]`, findings, docId));
  } else if (typeof val === 'object') {
    // Avoid circular or internal mongo properties
    for (const key of Object.keys(val)) {
      if (key.startsWith('$')) continue;
      scanValue(val[key], pathStr ? `${pathStr}.${key}` : key, findings, docId);
    }
  }
}

async function runAudit() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  console.log('🔍 Connecting to MongoDB for Security & XSS Audit...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB database:', mongoose.connection.name);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`\n📋 Found ${collections.length} collections to audit:\n` + collections.map(c => ` - ${c.name}`).join('\n'));

  let totalDocsScanned = 0;
  const allFindings = [];

  for (const colMeta of collections) {
    const colName = colMeta.name;
    // Skip system collections
    if (colName.startsWith('system.')) continue;

    const collection = mongoose.connection.db.collection(colName);
    const count = await collection.countDocuments();
    totalDocsScanned += count;

    process.stdout.write(`\n🔎 Auditing collection: "${colName}" (${count} documents)... `);

    const cursor = collection.find({});
    let colThreats = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const docFindings = [];
      scanValue(doc, '', docFindings, doc._id ? doc._id.toString() : 'unknown');

      if (docFindings.length > 0) {
        colThreats += docFindings.length;
        allFindings.push(...docFindings.map(f => ({ ...f, collection: colName })));
      }
    }

    if (colThreats === 0) {
      console.log('✅ Clean (0 XSS threats)');
    } else {
      console.log(`⚠️  FOUND ${colThreats} POTENTIAL THREAT(S)!`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🛡️  AUDIT RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total Collections Audited : ${collections.length}`);
  console.log(`Total Documents Scanned   : ${totalDocsScanned}`);
  console.log(`Total Potential Threats   : ${allFindings.length}`);

  if (allFindings.length === 0) {
    console.log('\n🎉 ALL CLEAR: Database me koi bhi XSS script ya payload store nahi hai.');
  } else {
    console.log('\n⚠️ DETECTED PAYLOADS:');
    allFindings.forEach((f, i) => {
      console.log(`\n[#${i + 1}] Collection: ${f.collection} | Doc ID: ${f.docId}`);
      console.log(`    Field   : ${f.path}`);
      console.log(`    Pattern : ${f.threat}`);
      console.log(`    Snippet : ${JSON.stringify(f.preview)}`);
    });
  }
  console.log('═══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

runAudit().catch(err => {
  console.error('❌ Audit failed with error:', err);
  process.exit(1);
});
