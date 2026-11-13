# Backlog

The ranked queue for the twice-daily routine. Statuses: `done`, `in PR`, `next` (exactly one),
`todo`, `blocked` (with a reason).

Volume · SD are Ubersuggest US figures pulled 29 October 2026 (rows 1–40) and 1 November 2026
(rows 41–101, the November keyword refresh). "check" means the routine
looks the keyword up before writing and records the figures in the PR.

## Rules

1. **Flagships first.** A flagship is pinned to a week (Monday date, Sydney). If its week
   arrives and it isn't `done` or `in PR`, it takes the next slot that week.
2. **Weekly mix:** about 8 library or guide pieces, 3 trends and 3 reviews or comparisons per
   14 slots. When adding rows, keep the order close to that mix.
3. **Reviews wait for testing notes.** A review or comparison row is skipped (not blocked)
   until `docs/testing/<platform>.md` exists for every platform it covers.
4. **No duplicates.** Before writing, check no published article already targets the keyword
   or a close variant. If one does, mark the row `blocked: duplicate of /<url>/` and move on.
5. **Library before its dependants.** A guide that leans on a principle links to the library
   entry; if the entry isn't published yet, link to it later in its re-check.
6. **Trends rows are prompts, not fixed topics.** For a trends row, find the most important
   development in that area in the last 60 days and write about it. Record the actual angle
   in the PR.
7. Keep at least 30 `todo` rows. The monthly keyword refresh adds more.

## Flagships (one per week)

The twice-daily cadence started on Friday 30 October 2026 with the ADDIE article. Flagships keep
their pinned weeks; the queue fills every other slot.

| Week of | Title | Keyword | Vol · SD | Kind | Hero | Status |
|---|---|---|---|---|---|---|
| 9 Nov 2026 | The ADDIE Model, Explained by a Working Course Designer | instructional design addie model | 1,300 · 10 | guide | documentary | done (launch article, Fri 30 Oct 00:00) |
| 16 Nov 2026 | Retrieval Practice: What the Research Says, Plus a Free Grid Template | retrieval practice grid | 2,400 · 17 | library | documentary | todo |
| 23 Nov 2026 | Teachable vs Thinkific: A Learning Designer's Comparison | teachable vs thinkific | 320 · 27 | comparison | screenshot | todo |
| 30 Nov 2026 | Worked Examples: How to Teach a Complex Skill Online | worked examples | 720 · 19 | library | documentary | todo |
| 7 Dec 2026 | What Are Microcredentials, and Are They Worth It? | what are microcredentials | 590 · 15 | trends | documentary | todo |
| 14 Dec 2026 | Kajabi Review: How Well Does It Support Learning? | kajabi review | 480 · 16 | review | screenshot | todo |
| 21 Dec 2026 | Spaced Repetition: Scheduling Review Across a Course | spaced repetition scheduler | 260 · 13 | library | risograph | todo |
| 4 Jan 2027 | Microlearning: What the Evidence Supports, With Examples | microlearning example | 320 · 23 | library | documentary | todo |
| 11 Jan 2027 | The Best Kajabi Alternatives, Ranked by How Well Students Learn | kajabi alternatives | 260 · 21 | comparison | documentary | todo |
| 18 Jan 2027 | Interleaving: Should Your Lessons Mix Topics? | interleaving learning strategy | check | library | risograph | todo |
| 25 Jan 2027 | Choosing an Instructional Design Course: What to Look For | online course on instructional design | 590 · 15 | guide | documentary | todo |
| 1 Feb 2027 | LearnWorlds vs Thinkific | learnworlds vs thinkific | 40 · 19 | comparison | screenshot | todo |

The retrieval practice grid flagship includes a downloadable grid template. Jim to supply or
approve the template file; the draft leaves a `[JIM: grid template]` slot.

## Features (commissioned by Jim)

Long-form interactive features Jim commissions directly. They keep their slot like a flagship and
don't use a queue row.

| Slot | Title | Keyword | Vol · SD | Kind | Status |
|---|---|---|---|---|---|
| Wed 11 Nov 00:00 (Tue 10 Nov 08:00 New York) | The Workplace Learning Paradox: More Training, Less Time to Learn | workplace learning | 140 · 23 | trends (feature) | in PR |

## Queue

| # | Working title | Keyword | Vol · SD | Kind | Status |
|---|---|---|---|---|---|
| 1 | An Online Course Design Checklist, Grounded in the Research | online course design checklist | 10 · 10 | guide | done (Fri 30 Oct 12:00) |
| 2 | Instructional Design Jobs for Former Teachers: Where Your Skills Transfer | instructional design jobs for former teachers | 880 · 16 | guide | done (Sat 31 Oct 00:00) |
| 3 | AI in eLearning: What's Changed This Term | ai in elearning | 70 · 25 | trends | done (Sat 31 Oct 12:00) |
| 4 | Cognitive Load: How Much Content Belongs in One Lesson? | cognitive load theory instructional design (row keyword "cognitive load theory in online courses" had 0 US/AU volume) | 20 · 5 | library | done (Sun 1 Nov 00:00) |
| 5 | Entry-Level Instructional Design Jobs: What Employers Ask For | instructional design entry level jobs | 720 · 9 | guide | done (Sun 1 Nov 12:00) |
| 6 | How to Write Learning Objectives Learners Can Actually Meet | how to write learning objectives | 590 · 27 | guide | done (Mon 2 Nov 00:00) |
| 7 | Microcredentials: The Latest Moves From Universities and Employers | micro credentials in higher education (row keyword "microcredentials news" had 0 US/AU volume) | 90 · 18 | trends | done (Mon 2 Nov 12:00) |
| 8 | Dual Coding: Making Visuals and Narration Work Together | dual coding theory and education (row keyword "dual coding" is 1,300 · 47 US, too hard for now) | 40 · 26 | library | done (Tue 3 Nov 00:00) |
| 9 | Thinkific Review: A Learning Designer's Verdict | thinkific review | 480 · 28 | review | todo |
| 10 | How to Create an Online Course That Sells (and Teaches) | how to create an online course that sells | 140 · 27 | guide | done (Tue 3 Nov 12:00) |
| 11 | Feedback That Improves Performance: What the Research Says | characteristics of effective feedback (row keyword "effective feedback in online learning" had 0 US volume) | 70 · 21 | library | done (Wed 4 Nov 00:00) |
| 12 | Thinkific Pricing Explained: Which Plan Do You Actually Need? | thinkific pricing | 1,000 · 29 | review | todo |
| 13 | Course Platforms: What Shipped This Month | ai course creation (row keyword "course platform updates" had 0 US volume) | 50 · 23 | trends | done (Wed 4 Nov 12:00) |
| 14 | Microlearning, Defined: When Short Lessons Work | microlearning defined | 260 · 22 | library | done (Thu 5 Nov 00:00) |
| 15 | How to Storyboard an eLearning Module | elearning storyboard | 50 · 20 | guide | done (Thu 5 Nov 12:00) |
| 16 | Are Microcredentials Worth It? What Learners and Employers Say | are microcredentials worth it | 50 · 22 | trends | blocked: duplicate of /trends/microcredentials-higher-education-this-term/ (targets "are micro credentials worth it" as a secondary keyword and FAQ) and of the 7 Dec flagship "What Are Microcredentials, and Are They Worth It?" |
| 17 | Teachable Alternatives: Better Fits for Different Courses | teachable alternatives | 140 · 16 | comparison | todo |
| 18 | The Testing Effect: Why Quizzes Teach as Well as Test | testing effect | 1,900 · 33 | library | blocked: same principle as the 16 Nov retrieval practice flagship; Jim to decide whether to fold "testing effect" into the flagship as a secondary keyword |
| 19 | Writing Multiple-Choice Questions That Teach as Well as Test | writing multiple choice questions (row keyword "how to design quiz questions" had 0 US volume) | 30 · 26 | guide | done (Fri 6 Nov 00:00) |
| 20 | Learning Styles: Why the Evidence Doesn't Support Them | are learning styles debunked (row keyword "learning styles myth" is 480 · 44 US, too hard for now; kept as secondary) | 30 · 7 | library | in PR (Fri 6 Nov 12:00) |
| 21 | Kajabi Pricing Plans Compared | kajabi pricing plan | 210 · 28 | review | todo |
| 22 | Online Education: The Research Worth Reading This Month | online learning research (row keyword "elearning research" is 10 · 20 US; kept as secondary). Angle: the University of Maryland course AI tutor trial | 20 · 14 | trends | done (Sat 7 Nov 00:00) |
| 23 | Kajabi vs Thinkific: Which Supports Learning Better? | kajabi vs thinkific | 210 · 28 | comparison | todo |
| 24 | Bloom's Taxonomy Examples: Using It to Design an Online Course | blooms taxonomy examples (row keyword "blooms taxonomy for course design" had 0 US volume; kept as secondary) | 320 · 13 | guide | in PR (Sat 7 Nov 12:00) |
| 25 | Elaboration: Getting Learners to Explain Why | what is elaborative interrogation (row keyword "elaboration learning strategy" is 70 · 42 US and "elaborative interrogation" 260 · 44, too hard for now; both kept as secondary) | 40 · 5 | library | in PR (Sun 8 Nov 00:00) |
| 26 | Online Course Completion Rates: What the Data Says and What Moves Them | online course completion rates (SD above 30; "online course completion rate" 10 · 5 kept as secondary) | 30 · 38 | guide | in PR (Mon 9 Nov 00:00) |
| 27 | LearnWorlds vs Teachable | learnworlds vs teachable | 40 · 13 | comparison | todo |
| 28 | Microlearning Platforms Compared for Workplace Training | microlearning platform | 320 · 17 | comparison | todo |
| 29 | The Learning Pyramid: Where the Famous Percentages Came From | learning pyramid (SD above 30 US; AU 720 · 30; "learning pyramid theory" 40 · 27 kept as secondary) | 2,400 · 38 | library | in PR (Mon 9 Nov 12:00) |
| 30 | Writing Course Scripts That Sound Human | elearning script (row keyword "elearning script writing" is 10 · 13 US; kept as secondary with "elearning script template" 170 · 28; checked 8 Nov 2026) | 70 · 19 | guide | in PR (Tue 10 Nov 12:00) |
| 31 | LearnWorlds vs Kajabi | learnworlds vs kajabi | 30 · 15 | comparison | todo |
| 32 | Generative AI Tutors: What the First Studies Found | ai tutor study | check | trends | blocked: duplicate of /trends/online-learning-research-ai-tutor-trial/ (targets "ai tutor study" and "ai tutor research" as secondary keywords and covers the Maryland, Khanmigo and Narine & Diaz trials, the main AI tutor studies of the last 60 days) |
| 33 | Formative Assessment Examples for Self-Paced Online Courses | formative assessment examples (row keyword "formative assessment online" is 30 · 19 US, 10 · 13 AU; kept as secondary; checked 9 Nov 2026) | 5,400 · 20 | library | in PR (Wed 11 Nov 12:00) |
| 34 | Backward Design in Instructional Design: Start With the Assessment | backwards design instructional design (row keyword "backward design" is 2,400 · 55 US, 210 · 44 AU, too hard for now; kept as secondary with "backwards design" 2,400 · 49; checked 9 Nov 2026) | 50 · 18 | guide | in PR (Thu 12 Nov 00:00) |
| 35 | The Best Microlearning Apps, Judged on Learning | best microlearning apps | 880 · 26 | comparison | todo |
| 36 | Self-Determination Theory: Motivating Learners in Online Courses | self determination theory (row keyword "motivation in online learning" is 10 · 5 US; kept as secondary with "self determination theory in education" 70 · 46; AU 4,400 · 25; checked 10 Nov 2026) | 18,100 · 23 | library | in PR (Thu 12 Nov 12:00) |
| 37 | How Long Should a Course Video Be? | how long should a training video be (row keyword "how long should course videos be" had 0 US volume, SD 4; kept as secondary with "what is the recommended length for an instructional video segment" 20 · 39 and "what makes a good instructional video" 20 · 11; AU 10 · 5; checked 11 Nov 2026) | 10 · 5 | guide | in PR (Fri 13 Nov 00:00) |
| 38 | Open Badges and Verifiable Credentials, Explained | open badges 3.0 (row keyword "open badges" is 210 · 62 US, too hard for now; kept as secondary with "verifiable credentials" 6,600 · 47; AU 10 · 20; checked 11 Nov 2026). Angle: the Learning Mobility Coalition, SchooLinks' Open Badges 3.0 and CLR 2.0 certification, and federal policy that doesn't yet name the standard | 50 · 28 | trends | in PR (Fri 13 Nov 12:00) |
| 39 | The Expertise Reversal Effect: When Help Starts to Hurt | expertise reversal effect example (row keyword "expertise reversal effect" is 90 · 49 US, 110 · 44 AU, too hard for now; kept as secondary with "the expertise reversal effect" 10 · 5 and "expertise reversal effect kalyuga" 10 · 5; checked 12 Nov 2026) | 10 · 5 | library | in PR (Sat 14 Nov 00:00) |
| 40 | How to Pilot a Course Before Launch | elearning testing (row keyword "how to test an online course" had 0 US/AU volume, SD 4; kept as secondary with "beta test online course" 0 · 4, "pilot testing" 1,000 · 35 and "formative evaluation" 1,300 · 31; AU 10 · 18; checked 12 Nov 2026) | 40 · 19 | guide | in PR (Sat 14 Nov 12:00) |
| 41 | What Is Scaffolding in Education? A Guide for Course Designers | what scaffolding in education | 5,400 · 7 | library | next |
| 42 | Instructional Design Jobs: Where the Work Is and What It Asks For | jobs instructional design | 14,800 · 21 | guide | todo |
| 43 | Instructional Design Models Compared: ADDIE, SAM, Dick and Carey and More | instructional design models | 390 · 28 | guide | todo |
| 44 | Instructional Design Portfolio Examples Hiring Managers Remember | instructional design portfolio examples | 260 · 18 | guide | todo |
| 45 | Digital Badges on LinkedIn: What Changed | linkedin digital badges | 140 · 19 | trends | todo |
| 46 | Types of Scaffolding, With Online Course Examples | types of scaffolding in education | 90 · 21 | library | todo |
| 47 | Instructional Design for Trainers: Turning a Workshop Into a Course | instructional design for trainers | 390 · 24 | guide | todo |
| 48 | Free Online Course Creation: What You Can Do Without Paying | free online course creation | 720 · 14 | guide | todo |
| 49 | Kajabi vs Teachable: Which Supports Learning Better? | kajabi versus teachable | 590 · 25 | comparison | todo |
| 50 | Instructional Design Internships: How to Find One and What You'll Do | instructional design internship | 590 · 22 | guide | todo |
| 51 | Principles of Learning Science Every Course Builder Should Know | principles of learning science | 210 · 22 | library | todo |
| 52 | Instructional Designer Salary: What the Data Actually Shows | instructional designer salary (row keyword "instructional design salary" 260 · 14 kept as secondary) | 880 · 25 | guide | in PR (Tue 10 Nov 00:00, written on request outside the routine) |
| 53 | Instructional Design Tools: What You Need and What You Don't | instructional design tools | 170 · 21 | guide | todo |
| 54 | Digital Badge Examples From Employers and Universities | digital badges examples | 140 · 21 | trends | todo |
| 55 | Part-Time Instructional Design Jobs: Where to Look | instructional design jobs part time | 320 · 10 | guide | todo |
| 56 | Gamification in eLearning: Examples and What the Evidence Says | examples of gamification in elearning | 40 · 25 | library | todo |
| 57 | Instructional Design Examples, Annotated | instructional design examples | 170 · 21 | guide | todo |
| 58 | LearnWorlds Pricing Explained | learnworlds price | 320 · 20 | review | todo |
| 59 | Instructional Design Contract Work: How Freelance Projects Run | instructional design contract work | 260 · 12 | guide | todo |
| 60 | The Kemp Model of Instructional Design, Explained | kemp model instructional design | 70 · 6 | guide | todo |
| 61 | Over-Scaffolding: When Support Gets in the Way | over scaffolding in education | 30 · 27 | library | todo |
| 62 | Corporate Instructional Design Jobs: What Changes From Education | corporate instructional design jobs | 140 · 23 | guide | todo |
| 63 | AI Tools for Instructional Design: What Shipped This Month | ai tools for instructional design | 70 · 10 | trends | todo |
| 64 | Agile Instructional Design: Running a Course Build in Sprints | agile instructional design | 70 · 24 | guide | todo |
| 65 | How to Create a Course on Teachable, Step by Step | how to create a course on teachable | 50 · 24 | guide | todo |
| 66 | Affective Learning Objectives: Examples for Attitudes and Values | affective domain learning objectives examples | 40 · 27 | guide | todo |
| 67 | What Is Thinkific? A Learning Designer's Overview | what is thinkific | 210 · 21 | review | todo |
| 68 | Working as an Instructional Design Consultant | instructional design consultant | 170 · 25 | guide | todo |
| 69 | Differentiation and Scaffolding in Online Courses | differentiation and scaffolding in education | 30 · 23 | library | todo |
| 70 | An Instructional Design Template for Your Next Course | instructional design template | 70 · 27 | guide | todo |
| 71 | Instructional Design Resume Examples | instructional design resume examples | 70 · 21 | guide | todo |
| 72 | Microcredentials for Teachers: The Latest Programs | microcredentials for teachers | 90 · 28 | trends | todo |
| 73 | Creating Digital Badges for Your Course | create digital badges | 50 · 11 | guide | todo |
| 74 | Project Management for Instructional Design | project management instructional design | 70 · 18 | guide | todo |
| 75 | Instructional Design Jobs in Higher Education | instructional design jobs in higher education | 70 · 26 | guide | todo |
| 76 | Thinkific Alternatives, Judged on Learning | thinkific alternative | 140 · 30 | comparison | todo |
| 77 | Is Instructional Design a Good Career? | is instructional design a good career | 50 · 28 | guide | todo |
| 78 | Instructional Design Job Descriptions, Decoded | instructional design job description | 50 · 27 | guide | todo |
| 79 | Thinkific Course Examples Worth Studying | thinkific courses examples | 30 · 23 | guide | todo |
| 80 | Freelance Instructional Design: Finding Your First Clients | freelance instructional design | 70 · 25 | guide | todo |
| 81 | Tech-Industry Microcredentials: AWS and the Latest Moves | aws microcredentials | 140 · 30 | trends | todo |
| 82 | Instructional Design Strategies That Hold Up in the Research | instructional design strategies | 50 · 26 | guide | todo |
| 83 | LearnWorlds Alternatives | learnworlds alternative | 40 · 10 | comparison | todo |
| 84 | Digital Promise Microcredentials: What's New | digital promise microcredentials | 140 · 29 | trends | todo |
| 85 | Teachable Cost: Plans and Fees Explained | teachable cost | 50 · 14 | review | todo |
| 86 | University AI Microcredentials: Who's Launching What | purdue ai microcredentials | 50 · 28 | trends | todo |
| 87 | Skool vs Teachable | skool vs teachable | 70 · 18 | comparison | todo |
| 88 | Online Learning Trends: What the Latest Data Shows | online learning trends | 50 · 23 | trends | todo |
| 89 | Thinkific Plus: What It Costs and Who It's For | how much is thinkific plus | 50 · 19 | review | todo |
| 90 | How Digital Badges Are Showing Up at Work | how are digital badges showing up in the workplace | 40 · 29 | trends | todo |
| 91 | Podia vs Teachable | podia vs teachable | 40 · 25 | comparison | todo |
| 92 | Instructional Design Conferences: What's Coming and What's Worth Attending | instructional design conferences | 110 · 20 | trends | todo |
| 93 | Thinkific Course Builder Review | thinkific course builder | 50 · 22 | review | todo |
| 94 | Google's Microcredentials and Career Certificates: Latest Moves | google microcredentials | 30 · 23 | trends | todo |
| 95 | Teachable vs Udemy: Your Own School or a Marketplace? | teachable vs udemy | 40 · 16 | comparison | todo |
| 96 | Microcredential Courses: What Universities Launched This Term | microcredentials course | 50 · 21 | trends | todo |
| 97 | Accredible Digital Badges Review | accredible digital badges | 40 · 23 | review | todo |
| 98 | Online Learning in Higher Education: This Term's Developments | online learning trends in higher education | 10 · 5 | trends | todo |
| 99 | Udemy vs Thinkific | udemy vs thinkific | 30 · 21 | comparison | todo |
| 100 | Teachable vs LearnDash | teachable vs learndash | 30 · 16 | comparison | todo |
| 101 | Thinkific Communities Review | thinkific communities | 40 · 25 | review | todo |
| 102 | Designing Online Courses for Low Bandwidth and Offline Learners | low bandwidth online learning (also: offline elearning 10 · 18, offline learning platform 10 · 22; checked 4 Nov 2026) | 10 · 5 | guide | todo |
| 103 | The Learning Curve: Where It Came From and What the Research Shows | learning curve (secondary: learning curve theory 140 · 40, ebbinghaus learning curve 110 · 34, steep learning curve meaning). Brief: `docs/briefs/learning-curve.md` | 8,100 · 35 | library | todo |
| 104 | Popular LMS Platforms, Mapped by Who Uses Them | popular lms platforms (secondary: list of lms platforms 50 · 19, examples of lms platforms 40 · 27, learning management system lms platforms 50 · 12; checked 8 Nov 2026). Data story, not a ranking: an animated, interactive wheel whose segments are markets (higher education, schools, corporate, government and VET, open source), with 10–15 platforms placed in the markets they serve; tapping one opens a card with its directory facts (pricing model, deployment, standards, status) and later its Discover profile. No rank numbers; higher-ed market share only as a cited figure on cards, from a source opened and dated. Reads from the directory records, never hand-copied. Needs: (1) directory PR #63 merged with the chosen profiles filled (pricing model, standards, primaryMarket for SAP and Workday); (2) a new wheel chart type in the story components (draws in on scroll, tap for a card, own design). | 50 · 16 | guide | blocked: waiting on the LMS profiles (PR #63) and the wheel chart component |

Row 102 brief (from an idea Jim sent, 4 Nov 2026): a vendor-neutral guide for course designers whose learners have slow, costly or patchy connections. Cover what goes wrong (buffering video, large downloads, dropped live sessions, assessments that need a connection), then the design responses: lightweight pages and media, offline downloads with sync, adaptive or low-resolution video with audio, transcript and slide alternatives, mobile-first layouts, and what to check in a platform (offline apps, PWA support, download options) with `[TO VERIFY]` on every platform claim. Find primary sources on connectivity and mobile learning (for example ITU or GSMA data, and studies of low-bandwidth or offline course delivery). Write it fresh: don't reuse wording from the source article.

## Later (higher difficulty, revisit once the domain has authority)

what is instructional design (1,300 · 42) · spaced repetition (6,600 · 65) · cognitive load theory (8,100 · 63) · retrieval practice
(2,900 · 61) · microcredentials (2,900 · 46) · microlearning apps (2,400 · 44) · kajabi pricing
(1,900 · 34) · how to create an online course (720 · 41) · teachable review (390 · 39) ·
learnworlds review (140 · 43) · best online course platform (90 · 34)
