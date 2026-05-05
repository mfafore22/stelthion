# Customer-Scoped LLM Training Set

Status: ready seed document for customer-specific fine-tuning.

Scope rules:
- Do not mix customers. Ideapark and Realidea are separate accounts, datasets, prompts, tool results, and future fine-tuned models.
- Fine-tune one LLM per customer. A model trained for one customer must not be used to answer another customer's requests.
- Do not change auth, 2FA, or OTP to support this. If auth integration is later needed, a developer must adapt it separately.
- Store prompt-answer pairs under `customerId` and `mallId`.
- Export only through an active-customer-scoped admin endpoint.
- Keep collecting until approximately 5,000 pairs per customer.

Live collection:
- `LlmTrainingPair` stores customer-scoped prompt-answer pairs from Concierge chat.
- ShopperMind feedback records training candidates with `source = shoppermind.feedback`.
- `/api/admin/llm-training/pairs` exports active-customer JSONL in chat fine-tuning format.
- The export includes source metadata, tool calls, attachments, and view context.

ShopperMind feedback training loop:
- Thumbs-up feedback becomes a weak positive training candidate.
- Thumbs-up with a comment becomes a stronger positive candidate.
- Thumbs-down with reason codes or a comment becomes a correction candidate.
- ShopperMind activity events are admin analytics signals, not direct training examples.
- High activity plus low feedback can still guide admin review of future training candidates.
- Feedback candidates must stay scoped by `customerId`, `mallId`, market, language, entity type, category IDs, and user verdict.
- Admin review should decide whether a candidate is accepted, ignored, needs source review, needs category correction, or needs action rewrite.
- Category feedback must preserve whether the category is present in the mall or absent but relevant.
- Absent but relevant categories are valid learning signals because a trend may reveal a leasing gap, campaign opportunity, or missing service category.
- Do not use one customer's feedback to tune another customer's LLM.

Seed prompt-answer pairs from recent product work:

```jsonl
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"In /shoppermind, the bar with Päänäkymä, Toimenpiteet, Trendit, Kilpailijat, Päätöksen tuki: property selector in Trendit is not responsive in width the same way as in Toimenpiteet. Make it behave the same way."},{"role":"assistant","content":"Make the Trendit property selector use the same responsive wrapper as Toimenpiteet: full width on small screens and fixed 320px width on xl layouts. Keep the existing selector component and only normalize the container behavior."}]}
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"There are language strings in TUNNUSLUVUT that are in English in non-USA markets. Check Finnish and Swedish translation strings and use localized natural industry terms."},{"role":"assistant","content":"Audit ShopperMind scenario and trend strings by locale and market. Replace English leakage such as curated discretionary with natural Finnish or Swedish equivalents, convert bps to localized basis-point wording such as kp in Finnish, and avoid Swedish terms when Finnish is selected. Preserve industry-accepted expert terminology where it is normal in the market."}]}
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"Whenever a path is referred to elsewhere in ShopperMind, it should be clickable and open the Path in Päänäkymä. Path has different cases in Finnish, eg Polku, polut, polussa, polkua."},{"role":"assistant","content":"Scope path-linking to ShopperMind-rendered content only. Detect explicit A/B/C path references across English and Finnish case forms, switch to the overview tab, scroll to the matching path, and highlight it. Do not globally link unrelated path references outside ShopperMind."}]}
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"If there are path references outside of ShopperMind that are not the same paths do not link them to ShopperMind."},{"role":"assistant","content":"Keep the parser local to ShopperMind scenario/action/competitor copy. Do not install a global markdown or text parser. Only references known to describe ShopperMind paths A, B, or C should navigate to the ShopperMind overview path panels."}]}
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"Check the hovering and transparency effects in the master UI and apply them universally in the application, including in ShopperMind where they apply."},{"role":"assistant","content":"Centralize reusable glass and hover utilities, then apply them to shared card, tab, button, metric, and ShopperMind panel surfaces. Static surfaces use transparent glass styling; interactive cards and links use the same lift, shadow, and press behavior while preserving active and semantic states."}]}
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"Plan how to connect the assistants and concierge chat. Assistants has assistant cards, security and data cards that are currently non functional. Plan realistic demo content while creating live piping for later."},{"role":"assistant","content":"Use Concierge as the single chat layer. Add a shared assistant launch flow with context, source module, return target, and starter prompt. Make assistant, security, and data cards open chat or scoped drawers. Extend view context to cover ShopperMind trends, paths, actions, campaign briefs, space suggestions, data sources, and security policies. Add demo tool outputs with live-ready schemas."}]}
{"messages":[{"role":"system","content":"You are a customer-scoped Stelthion coding/product assistant. Never mix customer data."},{"role":"user","content":"You are not allowed to change AUTH, 2FA or OTP. Isolate customer accounts strongly. Each LLM will be fine tuned per customer. Store prompt-answer pairs until about 5000 pairs and make a separate ready training document."},{"role":"assistant","content":"Do not edit auth, 2FA, or OTP code. Enforce application-layer mall/customer scoping in Concierge APIs, store LLM prompt-answer pairs with customerId and mallId, cap collection around 5,000 pairs per customer, and provide an active-customer-scoped JSONL export plus this seed training document."}]}
```

Developer note:
- If auth later needs to expose a richer active customer claim for non-admin users, adapt it outside this work. The current implementation uses existing session and active-customer helpers without modifying auth, 2FA, or OTP.
