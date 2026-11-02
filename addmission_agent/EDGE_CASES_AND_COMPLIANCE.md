# Edge Cases, Regulatory Compliance & Failure Modes

When deploying an automated admission follow-up system for an Indian school, several regulatory, operational, and technical edge cases must be strictly accounted for.

---

## 1. Regulatory Compliance (India: TRAI & DLT Mandates)

### A. TRAI Communication Time Window Gatekeeper
Under Telecom Regulatory Authority of India (TRAI) directives, sending transactional or informational messages to parents outside approved hours can lead to heavy carrier penalties or gateway suspension.

* **Allowed Window:** **09:00 AM to 07:00 PM IST (Mon–Sat)**.
* **Prohibited Window:** **07:00 PM to 09:00 AM IST & National Holidays**.
* **Agent Implementation:**
  ```python
  def is_within_trai_calling_hours() -> bool:
      now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
      # Monday is 0, Sunday is 6
      if now_ist.weekday() == 6:  # Sunday - Restrict automated follow-ups
          return False
      if time(9, 0) <= now_ist.time() <= time(19, 0):
          return True
      return False
  ```
* **Deferred Queue Rule:** If a lead arrives at 10:30 PM:
  * The parent instant confirmation SMS is allowed via **Service Implicit Transactional Route**.
  * The staff notification is sent to Telegram silently (muted).
  * Any scheduled follow-up calls or nudge SMS are queued for **09:15 AM the next working day**.

---

### B. DLT (Distributed Ledger Technology) SMS Formatting
In India, TRAI requires all commercial SMS to be pre-registered on a DLT portal (e.g., VilPower, Jio DLT, Airtel DLT).
* **Principal Entity ID (PEID):** School's registered 14-digit ID.
* **Sender ID (Header):** Fixed 6-alpha code (e.g., `SRVADA` or `SMSDEL`).
* **Content Template ID:** Every template has a unique 19-digit numerical ID.
* **Variable Validation:** Variables `{#var#}` must be under 30 characters and cannot contain URLs unless the URL was pre-approved.

---

## 2. Real-World Operational Edge Cases

### Edge Case 1: Offline Counter Fee Deposit Race Condition
* **Scenario:** A parent visits the school counter at 10:00 AM, verifies documents, and pays admission fees in cash/card. The clerk gives them a physical receipt. At 11:30 AM, an automated background job wakes up and fires an SMS: *"Reminder: Please visit school with your child's birth certificate"*.
* **Impact:** The parent feels confused and irritated, calling the helpline to check if their payment went through.
* **Solution (Pre-flight Status Check):**
  The agent **never** fires an action based on cached in-memory state. Directly before dispatching any SMS or staff call, it performs a real-time Firestore read:
  ```python
  async def send_scheduled_nudge(lead_id: str):
      lead = await db.collection("admissions_leads").document(lead_id).get()
      data = lead.to_dict()
      
      # Strict Abort Check
      if data.get("status") in ["ENROLLED", "REJECTED", "VERIFIED"]:
          logger.info(f"Skipping nudge for {lead_id}: Lead is already {data.get('status')}")
          return
  ```

---

### Edge Case 2: Sibling Multi-Child Deduplication
* **Scenario:** A parent registers two siblings (e.g., Aarav for Class 3rd and Ananya for Nursery) within 5 minutes of each other using the same mobile number.
* **Problem:** Parent gets 2 separate SMS alerts, and staff gets 2 separate Telegram notifications.
* **Solution (Intelligent Aggregator):**
  When a new lead arrives, the agent queries active leads submitted with the same phone in the past 60 minutes:
  * If found, the Telegram card is merged:
    > *"🔔 NEW ADMISSION INQUIRY (SIBLINGS BUNDLE)\n• Students: Aarav (Class 3rd) & Ananya (Nursery)\n• Parent: Rajesh Sharma (+91 9876543210)"*
  * The parent receives 1 consolidated SMS instead of 2.

---

### Edge Case 3: Parent Opt-Out / DND Handling
* **Scenario:** A parent informs the counselor: *"We have already taken admission in another branch"* or *"Please don't call again"*.
* **Solution:**
  1. Counselor taps `[ 🚫 Mark Ineligible / Opt-Out ]` in Telegram or selects `Closed` in `/admin/admissions`.
  2. The agent sets `isDND: true` and updates `status: "REJECTED"` in Firestore.
  3. The agent immediately purges all scheduled jobs in `APScheduler` matching that `lead_id`.

---

### Edge Case 4: Counselor Staff Absence / Unclaimed Leads
* **Scenario:** A counselor assigned to a set of leads falls sick or takes leave, causing leads to remain in `NEW` status for over 48 hours.
* **Solution (Automatic Pool Escalation):**
  If a lead is uncontacted after 36 hours:
  1. The lead is unassigned from the specific counselor.
  2. A broadcast alert is fired to the **School Principal / Head Admin** Telegram channel:
     > *"⚠️ UNCLAIMED LEAD ESCALATION: Lead SMS-ADM-2026-6814 has had no action for 36 hours. Re-routing to General Desk."*

---

## 3. Technical Failure Modes & Idempotency

### Failure Mode 1: Server Crash & Reboot During Job Execution
* **Risk:** The server restarts while executing a follow-up batch, causing the same parents to receive duplicate messages.
* **Solution (Idempotency Key):**
  Every outbound notification creates an entry in an `idempotency_keys` subcollection before sending:
  `key = f"followup_{lead_id}_{stage}_{date_str}"`
  If the key already exists in Firestore, the operation aborts with zero side-effects.

---

### Failure Mode 2: SMS Gateway Outage or Depleted Credits
* **Risk:** The Fast2SMS / MSG91 API returns `HTTP 402 Payment Required` or `HTTP 500`.
* **Solution (Dead Letter Queue & Alert):**
  * When SMS dispatch fails, the agent retries with exponential backoff (at 1m, 5m, 15m).
  * If still failing, it logs the event into `failed_dispatches` and sends an urgent notification to the School IT Administrator:
    > *"🚨 SMS GATEWAY ERROR: Insufficient SMS balance or API timeout. 3 parent messages queued."*

---

### Summary Checklist Before Launch

- [x] Pre-flight live status check to prevent post-payment reminder spam.
- [x] TRAI 9:00 AM – 7:00 PM time gatekeeper.
- [x] Telegram inline action callbacks for 1-tap counselor logging.
- [x] Sibling deduplication within 60-minute windows.
- [x] DND / Opt-Out cancellation hook.
- [x] Idempotency keys preventing duplicate messaging on server restarts.
