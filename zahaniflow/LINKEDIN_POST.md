Just shipped ZahaniFlow — https://zahaniflow.com/ 🚀

How I built a production clinical management system serving real healthcare providers:

The Challenge
Healthcare providers in Kenya and across Africa are often stuck with:
- Expensive, bloated EMR systems built for Western hospitals
- Excel spreadsheets and paper records
- Generic "clinic management" software that doesn't fit surgical practice workflows

I wanted something in between: powerful enough for real clinical use, simple enough to onboard in a day.

What ZahaniFlow does
• Patient demographics & medical history
• Appointment scheduling with calendar views
• Clinical case documentation (APOC structured format)
• Inpatient admission/discharge workflows
• Hospital assignment & bed management
• Medical imaging & document storage
• Role-based access (consultant vs assistant permissions)

Tech decisions that mattered
- Supabase over custom backend — PostgreSQL, auth, storage, and real-time out of the box. Saved me infrastructure time and allowed focus on domain logic.
- React Query (TanStack Query) for state management — optimistic updates & straightforward cache invalidation.
- Drizzle ORM — type-safe queries and migrations-as-code.
- Shadcn UI + Tailwind — beautiful, accessible components out of the box.

What I learned
• Start with workflows, not features. I built "admit a patient after surgery" not generic patient management.
• Real-time is expensive — 30s polling covers 90% of clinical cases.
• Good UX in healthcare reduces cognitive load—big buttons, obvious actions, clear confirmations.

Metrics so far
- Live in production with 1 consultant + 1 assistant
- ~50 patients in the system
- Zero critical bugs reported
- Average page load: <200ms

What's next
- Multi-hospital support
- Prescription management
- Billing integration with NHIF
- Mobile app for field work

If you're building healthcare software (or any domain-specific SaaS), happy to chat about what worked and what didn't.

#SoftwareEngineering #HealthTech #SaaS #React #TypeScript #Supabase #FullStack
