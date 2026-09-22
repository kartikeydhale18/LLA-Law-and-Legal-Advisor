# Product Requirements Document (PRD)
## LLA — Law and Legal Advisor

| | |
|---|---|
| **Version** | 2.0 |
| **Status** | Draft |
| **Budget constraint** | Must run entirely on free tiers |

---

## 1. Overview

LLA (Law and Legal Advisor) is a Generative AI-powered chatbot web application that helps users understand Indian law and the Constitution of India, and analyzes contracts, legal documents, and agreements — explaining them in simple language and offering legal guidance grounded in the Constitution, aimed at benefiting both parties involved in a legal matter.

## 2. Problem Statement

Most common people in India cannot easily understand legal documents, contracts, or their own rights under Indian law. This knowledge gap leads to unfair practices, one-sided agreements, and general distrust of the legal system among people who lack access to affordable legal counsel. LLA aims to close this gap by making legal information and basic legal assistance accessible, without replacing professional legal advice.

## 3. Purpose and Scope

- Help common people understand legal documents and legal information in simple, plain language.
- Build legal trust among the general public by making legal information transparent and understandable.
- Serve people in India who are not fully familiar with Indian law.
- Prevent unfair practices or actions that arise from a lack of legal knowledge.
- Support outcomes that benefit both parties involved in a legal contract, agreement, or dispute — not just one side.

### Out of Scope (for this version)
- Replacing a licensed advocate or providing binding legal representation.
- Court filing, litigation support, or case management.
- Legal coverage outside Indian law and the Constitution of India.

## 4. Target Users

- Individuals in India signing contracts or agreements (rental, employment, service, etc.) without a legal background.
- Small business owners or freelancers reviewing agreements before signing.
- Anyone seeking a plain-language explanation of a legal document or a basic legal question, before deciding whether to consult a professional.

---

## 5. Implementation Plan

### 5.1 MVP Scope

The MVP is scoped to prove the core value loop — plain-language legal Q&A and grounded document analysis — with minimal infrastructure.

**MVP-1: General legal Q&A**
User asks a question related to Indian law or the Constitution; the system retrieves relevant grounding text from a pre-loaded legal corpus and responds in simple, easy-to-understand language, with a citation to the relevant section/act.

**MVP-2: Document upload and analysis**
An authenticated user uploads a contract/agreement. The document is read (OCR/vision extraction), chunked, embedded, and stored in the vector database. The system then uses RAG to answer questions about that specific document, grounded in both the document's own text and the legal corpus. Upload is gated — only authenticated users can upload.

**MVP-3: Fair judgment**
Responses that offer a judgment or advice must not favor one party unfairly — outputs should consider the interests of every party involved in the matter, per NFR1 and NFR3 below.

### 5.2 Extended Features (post-MVP)

| # | Feature | Notes |
|---|---|---|
| i | Multi-language support | English, Hindi, and Marathi (see NFR10 for the OCR vs. UI language split) |
| ii | Login/authentication | Firebase Authentication — mobile OTP and email/password |
| iii | Chat history | Stored in Firestore (not the vector database — see Section 7) |
| iv | Application settings | Preferred language, notifications, dark/light mode — stored per-user in Firestore |
| v | *(open — to be defined)* | |

---

## 6. Functional Requirements

| # | Requirement |
|---|---|
| FR1 | Extract information from uploaded documents to explain to the user. |
| FR2 | Explain extracted legal information in simple, plain language. |
| FR3 | Explain and compare contracts, agreements, and policies (benefits, disadvantages, and outcomes), and suggest fair, mutually beneficial negotiation points for both parties. |
| FR4 | Highlight important clauses, obligations, risks, or inconsistencies based on the Constitution and applicable regulations. |
| FR5 | Answer user questions based on the uploaded legal documents and current regulations. |
| FR6 | Help users understand their available options and next steps; recommend consulting a licensed advocate when a matter is highly complex or risky. |
| FR7 | Generate summaries, checklists, and other actionable outputs from a document or conversation. |
| FR8 | Help users prepare information or questions ahead of meeting a legal professional. |

---

## 7. System Architecture

### 7.1 Component overview

- **Client** — Next.js frontend, hosted on Vercel.
- **Backend API** — FastAPI, hosted on AWS EC2, acting purely as an orchestrator (see 7.3 on keeping it lightweight).
- **Firebase** — Authentication, Firestore (user data, chat history, settings), and Storage (temporary file staging).
- **Pinecone** — vector database, holding two kinds of embeddings:
  1. The static Indian legal corpus (Constitution articles, acts) — pre-loaded once, shared across all users.
  2. Per-document embeddings from user uploads — isolated per user via namespace or a `user_id` metadata filter, so one user's document is never retrievable in another user's session.
- **LLM APIs** — Groq and Gemini, called by the backend for generation, and (see below) for OCR and embeddings too.

### 7.2 Document analysis / RAG flow

1. **Upload document** — authenticated users only; the backend independently re-verifies the Firebase auth token on every upload request rather than trusting the frontend check alone.
2. **Extraction** — the document (image/PDF) is sent to Gemini's multimodal/vision capability, which reads and extracts the text directly (see 7.3 for why this replaces a self-hosted OCR engine).
3. **Chunk and embed** — extracted text is chunked and embedded using Gemini's embedding API, then stored as vectors in Pinecone.
4. **RAG + LLM** — on a user question, the backend embeds the query, retrieves the most relevant chunks from both the legal corpus and (if relevant) the user's document, and passes them to the LLM as grounding context. The LLM is instructed to answer using only the retrieved context, and to flag any claim it cannot ground as low-confidence rather than stating it as fact.
5. **Response returned** — includes citations to the specific section/act relied on, and is checked against the fairness rule (NFR1) before being shown to the user.

### 7.3 Keeping the backend lightweight (RAM constraint)

The backend runs on an EC2 free-tier eligible instance (t2.micro/t3.micro, ~1 GB RAM). Even with this larger headroom than a typical free PaaS tier, self-hosting both an OCR engine (Tesseract) and a local embedding model risks running the instance tight on memory under concurrent requests — especially during a live demo. To avoid this:

- **OCR is not self-hosted.** Documents are sent to Gemini's vision capability for text extraction instead of running Tesseract locally. This also removes the need to install OCR language packs (Hindi, Marathi) on the server.
- **Embeddings are not self-hosted.** Embeddings are generated via Gemini's embedding API rather than loading a local sentence-transformer model into the FastAPI process.
- **Net effect:** the backend becomes a thin, I/O-bound orchestrator (call Gemini → call Pinecone → call Firestore → return response), which comfortably fits within free-tier memory limits and avoids the biggest crash risk in the original plan.

**Trade-off to note:** all OCR, embedding, and generation calls now depend on Gemini's free-tier rate limits. Combined usage should be monitored during testing, and current quota numbers should be checked directly on Google AI Studio before heavy use, since free-tier limits change over time.

---

## 8. Non-Functional Requirements

| # | Category | Requirement |
|---|---|---|
| NFR1 | Fair Use | The tool must not be used to enable illegal action; outputs should be fair to both parties in a contract or dispute. The system must restrict/refuse queries that seek to exploit legal loopholes or gain unfair advantage over the other party (e.g., asking how to hide an unfair clause, mislead the other party, or bypass their legal rights) — such queries should be declined or redirected toward a fair, mutually beneficial resolution instead. |
| NFR2 | Correctness | Statements must align with current Indian regulation and the Constitution. The system must retrieve grounding text from a verified legal corpus (via RAG) before generating any statutory claim — no claim should be generated from model memory alone. |
| NFR3 | Reliability / Reasoning | Every judgment must state *why* and *what* — citing the relevant legal clause, section, or chapter/act of the Constitution. Claims without retrieved supporting evidence must be flagged as low-confidence rather than stated as fact. |
| NFR4 | Security | Uploaded contracts and documents must remain confidential, with no unauthorized access or misuse. Data is secured using Firebase and Pinecone, both of which provide encryption at rest and in transit by default. User-uploaded document embeddings must be isolated per user in Pinecone (namespace or `user_id` metadata filter). |
| NFR5 | Performance | The application must be lightweight, fast, and responsive. Repository size must stay under 10 MB (see Section 9 for what this actually restricts). |
| NFR6 | Usability | The application must be easily accessible to Indian users, with support for multiple languages and a simple, intuitive UI usable by non-technical people. |
| NFR7 | Availability | The application should be available to users with minimal downtime, within the constraints of free-tier hosting (see Section 10 on cold starts). |
| NFR8 | Scalability | The system should remain responsive as the number of users grows significantly. |
| NFR9 | Disclaimer | Every chat session must display a disclaimer that the system is not a substitute for licensed legal counsel, and must explicitly flag high-risk or high-complexity matters. |
| NFR10 | Multilingual Support | Two separate language concerns, decoupled in the architecture: **(a) OCR input language** — the language of the uploaded document itself, handled by Gemini's vision extraction; Marathi is the priority given real documents observed, with Hindi as a close second. **(b) UI/interaction language** — the language the user asks questions and reads answers in; extracted/retrieved text is translated to English internally for grounding, then the final answer is translated back to the user's chosen language (English, Hindi, or Marathi) before display. |
| NFR11 | Input Limit | Uploaded document size must be limited to manage computational load and ensure prompt processing times. |
| NFR12 | Legal Consistency | Responses must remain consistent with the Indian Penal Code / Bharatiya Nyaya Sanhita, the Indian Contract Act, and relevant constitutional provisions. Where a state law and a central law conflict, the system should prioritize central law or clearly explain the potential conflict rather than pick silently. |
| NFR13 | Corpus Currency | Indian law changes over time. The system's legal corpus and judgments must be updated to reflect current law, and the corpus version / last-updated date should be visible to users. |

---

## 9. Tech Stack (all free-tier)

| Layer | Choice | Free-tier notes |
|---|---|---|
| Frontend | Next.js | Deployed on Vercel |
| Frontend hosting | Vercel | Free hobby tier — generous bandwidth, zero-config deploys |
| Backend | FastAPI | Kept as a thin orchestrator (see 7.3) to stay within RAM limits |
| Backend hosting | AWS EC2 (t2.micro/t3.micro) | Free-tier eligible instance, ~1 GB RAM; requires manual setup (process manager, security groups, TLS — see Section 10) |
| Authentication | Firebase Authentication | Free (Spark plan) up to a high monthly active user count; supports email/password and mobile OTP |
| Main database | Firestore | Free daily quota for reads/writes/deletes; stores user data, chat history, and settings |
| File storage | Firebase Storage | Free tier storage and daily download allowance; used only for temporary staging — raw files should be deleted after extraction (see below) |
| Vector database | Pinecone | Free tier (~2 GB), holds the legal corpus and per-user document embeddings |
| Document extraction (OCR) | Gemini (multimodal/vision) | Replaces a self-hosted OCR engine — see 7.3 |
| Embeddings | Gemini embedding API | Replaces a locally loaded embedding model — see 7.3 |
| LLM (generation) | Groq + Gemini | Groq for fast, lightweight Q&A/chat follow-ups; Gemini for RAG-grounded document analysis and long-context work |
| Version control | GitHub | Free public/private repos |

**Storage hygiene:** to stay within Firebase Storage's free daily download allowance and to minimize confidentiality risk, raw uploaded documents should be deleted after OCR extraction completes — only the extracted text and its embeddings are retained long-term.

---

## 10. Free-Tier Execution Plan

This section translates the "must run on free tiers" constraint into concrete build/deploy decisions.

1. **Repo size discipline** — `.gitignore` must exclude `node_modules/`, `.next/`, `__pycache__/`, `venv/`, `.env*`, and any sample/test documents used during development. This is what actually keeps the repo under 10 MB (see NFR5) — the framework choice itself does not affect repo size.
2. **EC2 setup checklist** — unlike a managed PaaS, EC2 needs manual setup before it behaves reliably: a process manager (gunicorn + systemd) so the app restarts automatically on crash or instance reboot, the correct security group rules opened (backend port, plus 80/443 if serving HTTPS directly), and TLS via Let's Encrypt/certbot (or a load balancer) since EC2 doesn't provide free auto-HTTPS the way Vercel/Render do. Do this setup early, not right before the demo.
3. **Rate-limit awareness** — since Gemini now handles OCR, embeddings, and (partly) generation, combined call volume during testing/demos should be watched against its free-tier rate limits; Groq can absorb some generation load to spread this out.
4. **Deployment order** — deploy backend (EC2) and confirm it's reachable before wiring the frontend (Vercel) to it, to isolate which side an issue is on.
5. **Namespacing in Pinecone from day one** — set up the per-user isolation (NFR4) at the start rather than retrofitting it later, since it affects how every document gets stored.
6. **Monitor free-tier/credit usage dashboards** (AWS billing console, Firebase, Pinecone, Google AI Studio) periodically during development — usage can creep up faster than expected once real documents are being tested, and AWS credits are finite (see risk below).

---

## 11. Risks & Assumptions

- **Risk:** LLM hallucination of legal facts if RAG grounding is bypassed or the corpus is incomplete. *Mitigation:* NFR2/NFR3 grounding and confidence flagging.
- **Risk:** Outdated legal corpus giving incorrect judgments as laws change. *Mitigation:* NFR13 versioning and update process.
- **Risk:** Free-tier/credit limits (AWS, Firebase, Pinecone, Vercel, Gemini) may be hit under real usage load, especially since OCR/embeddings now route through Gemini alongside generation. *Mitigation:* Section 10's monitoring and load-spreading steps.
- **Risk:** EC2 instance not auto-restarting after a crash or reboot if the process manager isn't configured correctly, causing downtime during evaluation. *Mitigation:* set up and test systemd auto-restart early, not right before submission.
- **Risk:** AWS's Free Plan (credit-based, ~6 months) could auto-expire or require a switch to Paid if credits run out. *Mitigation:* not a concern for this project's 1-month timeline, but worth checking remaining credit balance if the project continues past that window.
- **Assumption:** Users will primarily upload text-based or scanned PDF/image documents in Hindi, Marathi, or English.

## 12. Future Considerations

- Additional regional language support beyond Hindi/Marathi.
- Voice-based input/output for lower-literacy users.
- Integration with a directory of verified advocates for escalation when a matter is flagged high-risk.
- Defining Extended Feature (v) once scoped.
- **Optional file retention:** the current design discards raw uploaded files after extraction (no persistent storage). If a future version needs to let users re-download their original document, AWS S3's Always-Free tier (5 GB, does not expire with the 6-month Free Plan window) is the natural fit, since billing is already set up on this AWS account.

---

## 13. Notes for the Build Agent

These are constraints that are easy to override with a "default" choice if not repeated explicitly at build time. Do not deviate from these without flagging it first:

1. **Do not self-host OCR.** Do not install or call Tesseract. Document text extraction must go through Gemini's multimodal/vision capability (Section 7.2, step 2).
2. **Do not self-host embeddings.** Do not load a local sentence-transformer or embedding model into the backend process. Embeddings must be generated via Gemini's embedding API (Section 7.2, step 3).
3. **Verify auth server-side, not just client-side.** Every document upload request must have its Firebase auth token independently re-verified by the FastAPI backend, even if the frontend already checked login state.
4. **Isolate user document embeddings in Pinecone.** Use a namespace or `user_id` metadata filter on every write and query so one user's uploaded document is never retrievable in another user's session (NFR4).
5. **RAG is mandatory before any statutory claim.** The LLM must not generate a legal claim without first retrieving supporting context from Pinecone. If no relevant context is retrieved, the response must say so and flag low confidence rather than answering from model memory (NFR2, NFR3).
6. **Enforce the fairness rule at the prompt level.** The system prompt for any judgment/advice response must instruct the model to consider both parties' interests and refuse to help exploit loopholes or mislead a counterparty (NFR1).
7. **Delete raw uploaded files after extraction.** Only extracted text and its embeddings should be retained; do not keep the original uploaded file in Firebase Storage long-term.
8. **Do not commit `node_modules/`, `.next/`, `__pycache__/`, `venv/`, `.env*`, or test/sample documents.** Confirm `.gitignore` covers these before the first commit — this is what keeps the repo under 10 MB, not the choice of framework.
9. **Every chat response must include the legal disclaimer** (NFR9) — this is not optional or a one-time notice, it must appear per session/response as specified.
10. **Check current free-tier/credit limits before assuming capacity** (EC2 instance RAM and AWS credit balance, Firebase Firestore daily quotas, Pinecone index size, Gemini/Groq rate limits) — do not hardcode assumptions about these numbers, as they change over time.

---

## 14. Submission & Evaluation Criteria

The submission is evaluated by an AI code reviewer against six parameters. Build decisions should explicitly satisfy each of these — not just "work," but be visibly structured to score well on each:

| Criterion | What the agent must do |
|---|---|
| **Code Quality** | Clean, modular file/folder structure (separate routers, services, and utilities in FastAPI; separate components/hooks in Next.js). Meaningful naming, consistent formatting, no dead/commented-out code, no duplicated logic. Handle errors explicitly (try/except around every external API call — Gemini, Groq, Pinecone, Firebase — with clear failure responses, not silent crashes). |
| **Security** | No API keys or secrets committed to the repo — all in environment variables, with a `.env.example` (no real values) committed instead of the real `.env`. Server-side auth verification on every protected route (per Section 13, point 3). Input validation on all user-submitted data (document size limits per NFR11, sanitized text inputs) to prevent injection or oversized-payload abuse. Encryption reliance on Firebase/Pinecone defaults documented (NFR4). |
| **Efficiency** | Lightweight backend as an orchestrator, no self-hosted OCR/embedding models (Section 7.3). Avoid redundant API calls — cache legal corpus embeddings rather than re-embedding on every request; batch embedding calls where possible. Keep prompt/context sizes reasonable to control latency and free-tier rate-limit usage. |
| **Testing** | At minimum, include tests for the highest-risk flows: auth verification on upload, RAG retrieval returning grounded (non-hallucinated) context, and the fairness check not favoring one party. A `tests/` folder with even a small, focused test suite is expected — untested code on these specific flows is a weak point given the domain. |
| **Accessibility** | Frontend must use semantic HTML, sufficient color contrast, alt text on any icons/images, keyboard-navigable forms (especially the document upload and chat input), and screen-reader-friendly labels — this is a scored criterion independent of NFR6's general usability language, so it should be treated as a concrete UI checklist, not just a principle. |
| **Problem Statement Alignment** | Every functional requirement (FR1–FR8, Section 6) traces directly to a use case named in the original problem statement (simplify documents, compare agreements, highlight clauses/risks, answer questions, explain next steps, generate summaries/checklists, prepare for a legal professional). The agent should be able to point to which FR each built feature satisfies. |

### Submission logistics (not code-related, but blocking if missed)
- The GitHub repository **must be public** — a private or restricted link will not be evaluated at all, regardless of code quality.
- Repository size must stay under 10 MB (NFR5, Section 10, point 1) — confirm this right before submission, not just at project start.
- Only 3 submission attempts are allowed for this round — treat the first submission as a real attempt, not a draft; verify the repo is public and under 10 MB immediately before each submission.