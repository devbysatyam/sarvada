/**
 * Sarvada Modern Secondary School
 * Autonomous Admission Follow-up & WhatsApp Automation Daemon
 * (Laptop / VPS / Cloud Background Worker)
 * 
 * Capabilities:
 * - Real-time monitoring of incoming admission inquiries
 * - Autonomous follow-up triggers for overdue leads (>24h or uncontacted)
 * - Meta WhatsApp Business Cloud API integration & WhatsApp Web fallback links
 * - Live terminal dashboard with pending counselor worklists
 * - Automated scheduler / watch loop for continuous hands-free operation
 * 
 * Usage:
 *   node agent_daemon.js                   # Run single briefing & print worklist
 *   node agent_daemon.js --auto-followup   # Automatically dispatch WhatsApp reminders to overdue leads
 *   node agent_daemon.js --watch           # Run continuous polling daemon (default 30 min)
 *   node agent_daemon.js --watch --interval=15  # Custom polling interval in minutes
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  BASE_URL: process.env.SARVADA_API_BASE || 'http://localhost:3000',
  SCHOOL_NAME: 'Sarvada Modern Secondary School',
  SCHOOL_PHONE: '+91 99994 39422',
  CAMPUS: 'Sadatpur, Karawal Nagar, Delhi — 110090',
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response from ${url}: ${data.slice(0, 100)}`));
        }
      });
    }).on('error', reject);
  });
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const postData = JSON.stringify(body || {});

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function generateWhatsAppText(lead) {
  const parent = lead.parentName || 'Parent';
  const student = lead.studentName || 'your child';
  const grade = lead.grade || 'the applied grade';
  const ref = lead.referenceNumber ? ` (Ref ID: ${lead.referenceNumber})` : '';

  return (
    `Namaste ${parent} ji! 🙏\n\n` +
    `Greetings from *Sarvada Modern Secondary School*, Sadatpur, Karawal Nagar, Delhi.\n\n` +
    `We received your admission inquiry for *${student}* for *${grade}*${ref}.\n\n` +
    `Our school campus is open Monday to Saturday from 8:00 AM to 2:30 PM for campus visits, counseling, and document verification.\n\n` +
    `Please let us know if you have any questions or when you would like to schedule your campus visit.\n\n` +
    `School Helpline: ${CONFIG.SCHOOL_PHONE}\n` +
    `Campus: ${CONFIG.CAMPUS}`
  );
}

async function runBriefing() {
  console.clear();
  console.log('='.repeat(72));
  console.log(`  ${CONFIG.SCHOOL_NAME.toUpperCase()} — AUTONOMOUS ADMISSION AGENT`);
  console.log('  Autonomous Follow-Up, WhatsApp Dispatch & CRM Daemon');
  console.log('='.repeat(72));
  console.log(`[+] Run Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`[+] Connecting to: ${CONFIG.BASE_URL}\n`);

  try {
    const response = await fetchJSON(`${CONFIG.BASE_URL}/api/admin/leads?status=all`);

    if (!response.success) {
      throw new Error(response.error || 'Server returned unsuccessful response');
    }

    const { summary, classDistribution, todayFollowUps, leads } = response;

    // 1. Executive Summary Table
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│                    EXECUTIVE LEADS SUMMARY                       │');
    console.log('├────────────────────────┬─────────────────────────────────────────┤');
    console.log(`│ Total Inquiries Came   │ ${String(summary.total).padEnd(39)} │`);
    console.log(`│ Pending Follow-up      │ ${String(summary.pendingFollowUpsToday + ' leads action due').padEnd(39)} │`);
    console.log(`│ In Progress / Called   │ ${String(summary.contacted).padEnd(39)} │`);
    console.log(`│ Admission Done         │ ${String(summary.enrolled + ' (' + summary.conversionRate + ' conversion)').padEnd(39)} │`);
    console.log(`│ Not Interested         │ ${String(summary.notInterested || 0).padEnd(39)} │`);
    console.log(`│ Rejected with Reason   │ ${String(summary.rejected).padEnd(39)} │`);
    console.log(`│ Skool24 CRM Synced     │ ${String(summary.crmSynced + ' / ' + summary.total + ' leads').padEnd(39)} │`);
    console.log('└────────────────────────┴─────────────────────────────────────────┘\n');

    // 2. Class-Wise Breakdown
    console.log('📌 CLASS-WISE INQUIRY BREAKDOWN:');
    for (const [cls, count] of Object.entries(classDistribution)) {
      const bar = '█'.repeat(Math.min(25, count));
      console.log(`  • ${cls.padEnd(14)}: ${String(count).padStart(3)} ${bar}`);
    }
    console.log('');

    // 3. Worker Action List for Today
    console.log('🔔 COUNSELOR / WORKER ACTION QUEUE FOR TODAY:');
    if (todayFollowUps.length === 0) {
      console.log('  ✨ Great job! All inquiries have been followed up. Zero pending.');
    } else {
      console.log(`  Found ${todayFollowUps.length} inquiries requiring follow-up:\n`);
      todayFollowUps.slice(0, 10).forEach((item, idx) => {
        const phone = (item.phone || '').replace(/\D/g, '').slice(-10);
        const waText = generateWhatsAppText(item);
        const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}`;

        console.log(`  [${idx + 1}] ${item.studentName} (${item.grade || 'Nursery'}) — Ref: ${item.referenceNumber || 'N/A'}`);
        console.log(`      Parent: ${item.parentName || 'N/A'} | Phone: ${phone}`);
        console.log(`      Status: ${item.status || 'NEW'} | Hours: ${item.hoursElapsed || 0}h ${item.isOverdue ? '⚠️ (OVERDUE > 24H)' : ''}`);
        console.log(`      Action: ${item.suggestedAction || 'Call Parent'}`);
        console.log(`      WhatsApp URL: ${waUrl}`);
        console.log('      ' + '-'.repeat(55));
      });

      if (todayFollowUps.length > 10) {
        console.log(`  ... and ${todayFollowUps.length - 10} more leads. View full list on ${CONFIG.BASE_URL}/admin/admissions\n`);
      }
    }

    return { todayFollowUps, summary };
  } catch (err) {
    console.error('[!] Error connecting to Admission API:', err.message);
    console.log('💡 Tip: Ensure server is running (`npm run dev`) or SARVADA_API_BASE is set.\n');
    return null;
  }
}

async function runAutonomousFollowUp() {
  console.log('\n[⚡] Triggering Autonomous Follow-Up Engine via API...');
  try {
    const res = await postJSON(`${CONFIG.BASE_URL}/api/admin/leads/auto-followup`, {});
    if (res.success) {
      console.log(`[✔] Autonomous Engine Result: ${res.message}`);
      if (res.summary) {
        console.log(`    - Eligible Evaluated: ${res.summary.eligibleEvaluated}`);
        console.log(`    - Dispatched via Meta API: ${res.summary.dispatchedViaApi}`);
        console.log(`    - Queued for Manual/Web: ${res.summary.queuedForManualWeb}`);
      }
    } else {
      console.warn(`[!] Auto follow-up warning: ${res.error || 'Unknown'}`);
    }
  } catch (err) {
    console.error('[!] Auto follow-up request failed:', err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isAutoFollowup = args.includes('--auto-followup');
  const isWatch = args.includes('--watch');

  let intervalMinutes = 30;
  const intervalArg = args.find(a => a.startsWith('--interval='));
  if (intervalArg) {
    const parsed = parseInt(intervalArg.split('=')[1], 10);
    if (!isNaN(parsed) && parsed > 0) intervalMinutes = parsed;
  }

  // 1. Run Initial Briefing
  const result = await runBriefing();

  // 2. If --auto-followup flag is passed, dispatch reminders
  if (isAutoFollowup) {
    await runAutonomousFollowUp();
  }

  // 3. If --watch flag is passed, run periodic schedule
  if (isWatch) {
    console.log(`\n[⏳] Watch mode active. Running autonomous checks every ${intervalMinutes} minutes.`);
    console.log('    Press Ctrl+C to terminate the daemon.\n');

    setInterval(async () => {
      console.log(`\n[🔄] Running scheduled check at ${new Date().toLocaleTimeString('en-IN')}...`);
      await runBriefing();
      if (isAutoFollowup) {
        await runAutonomousFollowUp();
      }
    }, intervalMinutes * 60 * 1000);
  }
}

main();
