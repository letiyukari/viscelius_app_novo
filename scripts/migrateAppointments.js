#!/usr/bin/env node
/**
 * scripts/migrateAppointments.js
 *
 * Migração dos documentos da coleção `appointments`:
 *  - Adiciona `startTime` / `endTime` como Firestore Timestamp
 *    (derivados de `slotStartsAt` / `slotEndsAt`)
 *  - Normaliza `status` para minúsculo: "pending" | "confirmed" | "canceled"
 *
 * INSTRUÇÕES DE USO:
 * 1. No Firebase Console: ⚙️ Project Settings → Service accounts → Generate new private key (Node.js)
 * 2. Salve o arquivo JSON como `serviceAccountKey.json` na raiz do projeto (NÃO versionar)
 * 3. Instale a dependência: `npm install firebase-admin`
 * 4. Rode:
 *      - Dry-run: `node scripts/migrateAppointments.js --dry-run`
 *      - Aplicar  : `node scripts/migrateAppointments.js --commit`
 *
 * Observações:
 *  - O script é idempotente: documentos com `startTime` já definido são ignorados.
 *  - Lotes de escrita usam batches de até 300 documentos.
 *  - Logs sumarizam total processado, migrado, pulado e erros.
 *
 * Checklist de testes manuais recomendados:
 * 1) Criar appointment manualmente com `patientId` de teste, `slotStartsAt` / `slotEndsAt` válidos
 *    e `status` "CONFIRMED" — a migração deve gerar `startTime` / `endTime` como Timestamp e salvar status "confirmed".
 * 2) Abrir a Home do paciente: o card “Sua Próxima Sessão” precisa exibir a sessão via onSnapshot.
 * 3) Ajustar o horário de `slotStartsAt`/`slotEndsAt` para uma data mais próxima: o card deve atualizar em tempo real.
 * 4) Mudar o status para "canceled": o card deve ocultar a sessão e mostrar “Nenhuma sessão futura”.
 * 5) Inspecionar o console do navegador: verificar ausência de warnings de memory leak (listener limpo corretamente).
 */

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const SERVICE_KEY_PATH = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(SERVICE_KEY_PATH)) {
  console.error('❌ Arquivo serviceAccountKey.json não encontrado.\n' +
    'Siga as instruções no topo deste script para gerar e posicionar a chave.');
  process.exit(1);
}

const serviceAccount = require(SERVICE_KEY_PATH);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const PAGE_SIZE = 500;
const BATCH_LIMIT = 300;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run') || !args.includes('--commit');
const APPLY_CHANGES = args.includes('--commit');

if (DRY_RUN) {
  console.info('📝 Rodando em modo dry-run (nenhuma alteração será aplicada).');
} else {
  console.info('🚀 Modo commit ativado: alterações serão gravadas.');
}

const STATUS_MAP = new Map([
  ['pending', 'pending'],
  ['confirmed', 'confirmed'],
  ['canceled', 'canceled'],
]);

function normalizeStatus(rawStatus) {
  const candidate = String(rawStatus || '').trim().toLowerCase();
  return STATUS_MAP.get(candidate) || 'pending';
}

function toTimestamp(source) {
  if (!source) return null;
  try {
    if (source._seconds && source._nanoseconds) {
      return new admin.firestore.Timestamp(source._seconds, source._nanoseconds);
    }
    if (typeof source.toDate === 'function') {
      return admin.firestore.Timestamp.fromDate(source.toDate());
    }
    if (source instanceof Date) {
      return admin.firestore.Timestamp.fromDate(source);
    }
    if (typeof source === 'string' || typeof source === 'number') {
      const tmp = new Date(source);
      if (!Number.isNaN(tmp.getTime())) {
        return admin.firestore.Timestamp.fromDate(tmp);
      }
    }
  } catch (error) {
    console.warn('⚠️  Falha ao converter data:', source, error.message);
  }
  return null;
}

async function migrateAppointments() {
  const appointmentsRef = db.collection('appointments');

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkippedNoSlot = 0;
  let totalAlreadyMigrated = 0;
  let totalErrors = 0;

  let lastDoc = null;
  let page = 0;

  do {
    page += 1;
    let query = appointmentsRef.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    console.info(`\n📄 Página ${page} → ${snapshot.size} documentos`);

    let batch = null;
    let batchCounter = 0;

    const flushBatch = async () => {
      if (!batch || batchCounter === 0) return;
      if (DRY_RUN) {
        console.info(`   ▶️  [dry-run] Batch com ${batchCounter} updates seria commitado.`);
        batch = null;
        batchCounter = 0;
        return;
      }

      try {
        await batch.commit();
        console.info(`   ✅ Batch commitado (${batchCounter} docs).`);
      } catch (error) {
        totalErrors += batchCounter;
        console.error('   ❌ Erro ao aplicar batch:', error);
      } finally {
        batch = null;
        batchCounter = 0;
      }
    };

    for (const docSnap of snapshot.docs) {
      totalProcessed += 1;
      const data = docSnap.data() || {};

      if (data.startTime instanceof admin.firestore.Timestamp) {
        totalAlreadyMigrated += 1;
        continue;
      }

      const startTime = toTimestamp(data.slotStartsAt);
      const endTime = toTimestamp(data.slotEndsAt);

      if (!startTime) {
        totalSkippedNoSlot += 1;
        console.warn(`   ⚠️  Pulando ${docSnap.id}: slotStartsAt ausente ou inválido.`);
        continue;
      }

      const normalizedStatus = normalizeStatus(data.status);

      const updatePayload = {
        startTime,
        status: normalizedStatus,
      };

      if (endTime) {
        updatePayload.endTime = endTime;
      }

      if (!batch) {
        batch = db.batch();
        batchCounter = 0;
      }

      batch.update(docSnap.ref, updatePayload);
      batchCounter += 1;
      totalUpdated += 1;

      console.info(
        `   • ${docSnap.id} => startTime: ${startTime.toDate().toISOString()}, ` +
          `endTime: ${endTime ? endTime.toDate().toISOString() : 'null'}, status: ${normalizedStatus}`
      );

      if (batchCounter >= BATCH_LIMIT) {
        await flushBatch();
      }
    }

    await flushBatch();

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  } while (true);

  console.info('\n===== RESUMO DA MIGRAÇÃO =====');
  console.info(`Total processado       : ${totalProcessed}`);
  console.info(`Já migrados (startTime): ${totalAlreadyMigrated}`);
  console.info(`Atualizados            : ${totalUpdated}`);
  console.info(`Sem slotStartsAt       : ${totalSkippedNoSlot}`);
  console.info(`Erros                   : ${totalErrors}`);
  console.info(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'}`);
}

migrateAppointments()
  .then(() => {
    console.info('\n✨ Migração finalizada.');
    if (DRY_RUN) {
      console.info('Nenhum dado foi alterado (dry-run).');
    } else {
      console.info('Verifique no console do Firestore os novos campos startTime/endTime e status normalizado.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migração finalizada com erro:', error);
    process.exit(1);
  });
