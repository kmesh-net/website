---
title: "From Contributor to Maintainer: My LFX Mentorship Journey (Or How I Accidentally Became Responsible for Things)"
authors:
  - jayesh9747
date: 2025-02-14
sidebar_position: 2
---

### 👋 Plot Twist: I'm Now a Maintainer

Hi everyone! I'm Jayesh Savaliya, a B.Tech student at IIIT Pune who somehow convinced people I know what I'm doing with backend technologies and open source. Over the last two years, I've managed to get selected for the C4GT program twice (2024 & 2025) - yes, they let me back in - and cracked LFX Mentorship 2025 (Term 1).

In this blog, I'll share:
- How I stumbled into open source (spoiler: it wasn't a master plan)
- My totally-not-secret strategies to crack programs like LFX
- Why I chose Kmesh (hint: eBPF is cool, okay?)
- How I went from "can I contribute?" to "wait, I'm responsible for this now?"
- Some actually useful advice that isn't just "be passionate"

---

### 🚀 My Open Source Origin Story

When I applied to LFX, I wasn't some open source newbie who just discovered GitHub last week. I had already battle-tested myself with:
- **Sunbird** (EkStep Foundation) via C4GT - where I learned that education tech is harder than it looks
- **Mifos** - a GSoC org focused on financial services (because who doesn't want to debug payment systems at 2 AM?)
- A few other backend projects where I definitely didn't break production. Much.

#### 🔍 Choosing the Right Project (AKA: "Eeny, Meeny, Miny, Moe" But Make It Strategic)

I shortlisted 2–3 projects from the LFX portal based on some highly scientific criteria:
1. **Tech stack relevance** - Does it use technologies I want to master?
2. **Learning potential** - Will this make me sound smart at tech meetups?
3. **Active maintainers** - Are these people actually responsive, or is this a ghost town?

Eventually, I chose **Kmesh** - a high-performance service mesh data plane built on eBPF and programmable kernel technologies. What made me choose it?

**The Technical Answer:** Kmesh's sidecarless architecture eliminates proxy overhead, resulting in better forwarding performance and lower resource consumption. It's bleeding-edge systems programming meets networking optimization.

**The Real Answer:** It had "eBPF" in the description, and I wanted to feel like a kernel wizard. Also, the maintainers seemed nice.

---

### 💡 How to Actually Crack an Open Source Program (My 3-Step Formula)

Forget the "just be passionate" advice. Here's what actually worked:

#### 1. ✅ Make Meaningful Contributions (Start Small, Dream Big)

**The Wrong Way:** "I'll start by rewriting the entire architecture!"

**The Right Way:**
- Week 1-2: Fix typos, improve logs, update docs
- Week 3-4: Fix small bugs, add tests
- Week 5+: Core features, refactoring, "I understand this codebase now"

This progression shows mentors you're not just throwing random PRs at the wall to see what sticks.

#### 2. 📝 Write a Proposal That Doesn't Put People to Sleep

Your proposal should be:
- **Clear:** No buzzword bingo. Explain what you'll do in plain English.
- **Structured:** Timeline with milestones. Bonus points if you actually follow it later.
- **Convincing:** Why you? What makes you not-terrible at this?

**Pro tip:** If your proposal is longer than your actual code contributions, you're doing it wrong.

#### 3. 💬 Be Actively Involved (Without Being *That* Person)

Stay present in project channels (Slack, Discord, mailing lists). Communicate with mentors. Ask questions. Suggest improvements.

But also: Don't spam. Don't ask questions Google could answer. Don't @ everyone at 3 AM with "quick question."

**The Formula:** Contribute + Propose + Communicate = You stand out (in a good way)

---

### 👨‍💻 The Accidental Path to Maintainership

Becoming a maintainer wasn't some grand plan. It happened because I apparently couldn't stop contributing even when the mentorship officially ended.

Here's the not-so-secret sauce:

#### 🔄 Consistency (AKA: The "Keep Showing Up" Method)
I didn't stop after my first merged PR and call it a day. I kept going:
- Fixing bugs nobody noticed
- Adding features people actually wanted
- Refactoring code that made future-me's life easier

#### 🧠 Learning Mindset (Or: "I Have No Idea What I'm Doing, But I'll Figure It Out")
Every learning curve was just another opportunity to feel confused and then triumphant:
- eBPF concepts? Started clueless, ended slightly less clueless
- Performance optimization? Learned by making things slower first
- CI/CD improvements? Broke the build a few times, now I own it

#### 🤝 Patience & Feedback (The "Don't Take It Personally" Skill)
Code reviews can be brutal. I learned to:
- Take feedback seriously (even when it stings)
- Iterate quickly (because blockers are expensive)
- Stay patient when things break (they will break)

#### 🚀 Initiative (The "What If We Just..." Trait)
I started acting like an owner before I was one:
- Suggesting improvements to the project
- Writing better tests (because flaky tests are the worst)
- Automating repetitive tasks (because I'm lazy efficiently)
- Reviewing others' contributions (giving back feels good)

**The Result:** By the end of my mentorship, the maintainers trusted me enough to grant maintainer access.

From "hey can I fix this typo?" to "you're now responsible for reviewing PRs" - it was surreal, humbling, and honestly pretty cool.

---

### 🎯 Actual Advice for Aspiring Contributors

Let me cut through the inspirational fluff:

#### 🧱 Start small, but stay consistent
You're not going to rewrite the kernel on day one. Start with something tiny. Then keep going.

#### 🎯 Focus on learning, not just selection
Getting selected is great. Learning enough to be useful is better.

#### 📢 Communicate actively and respectfully
Ask questions. Share progress. Be helpful. Don't be annoying. It's a fine line.

#### 🚀 Don't be afraid to suggest improvements
If you see something that could be better, say something. The worst they can say is "no" (or "did you actually read the docs?").

#### 🛠️ Embrace feedback, be solution-oriented
Nobody's code is perfect on the first try. Take the feedback, fix it, move on. Arguing about semicolons is not a good use of anyone's time.

**The Truth:** You don't need to be a genius. You just need to:
1. Show up
2. Contribute
3. Improve
4. Repeat

---

### 🙌 Final Thoughts (The Sentimental Part)

The LFX Mentorship taught me more than just how to write better code. It taught me:
- How to work with a global, distributed team (timezones are fun!)
- How to think critically about production-grade software (spoiler: logs are important)
- How to grow from contributor to leader in a community (responsibility is scary but worth it)

If I can go from "nervous first-time contributor" to "wait, people are asking me for code reviews?", then you absolutely can too.

Let's keep building, learning, and supporting each other in this amazing open source ecosystem. And maybe, just maybe, you'll accidentally become a maintainer too.

---

### 📬 Let's Connect

Want to talk about open source, eBPF, or why debugging kernel code at 2 AM is actually kind of fun?

- 🔗 [LinkedIn](https://linkedin.com/in/jayesh-savaliya)
- 💻 [GitHub](https://github.com/jayesh9747)

Thanks for reading - see you in the next PR 🚀

*P.S. - If you're reading this because you're procrastinating on your own open source contributions, close this tab and go fix that bug you've been avoiding. I believe in you.*
