OMNEXUS REVOLUTIONARY MASTER PLAN

The complete vision for building the world's most intelligent fitness application

VISION STATEMENT

Omnexus is not a workout tracker. It is an intelligent coaching system that learns who you are, teaches you the science behind your training, guides your body transformation, and keeps you engaged every single day with the same addictive quality that Duolingo applies to language learning. The goal is not to make a good fitness app. The goal is to make fitness education and training so compelling and personalized that users choose Omnexus over a real gym membership because the experience is better.

PART ONE — THE EXERCISE LIBRARY

CURRENT STATE AND TARGET

The current library has 61 exercises. That is not enough for a production fitness application. Premium apps carry between 300 and 700 exercises. Our target for the first sprint is 300 exercises. The long-term target is 500 exercises organized into a fully searchable, filterable, and visually rich database that rivals what you would find on a dedicated exercise reference platform.

EXERCISE DATABASE ARCHITECTURE

Each exercise entry will carry the following data:

Identifier and name fields. The id is a hyphenated lowercase string used throughout the system. The name is the display name shown to users.

Classification fields. The category is strength, cardio, or mobility. The movement pattern is one of squat, hinge, push-horizontal, push-vertical, pull-horizontal, pull-vertical, isolation, carry, or cardio. Primary and secondary muscle groups drawn from an expanded MuscleGroup union type.

Equipment requirements. The equipment array uses the expanded Equipment union type. An exerciseVariants field will list bodyweight, dumbbell, or band substitutions so the program generator can automatically swap exercises when a user lacks specific equipment.

Difficulty rating. A number from 1 to 5 indicating beginner through elite level. This feeds the program generator to avoid assigning technically demanding movements to beginners.

Instructional content. A steps array for the execution walkthrough. A commonMistakes array describing what to avoid and why. A coachingCues array with short verbal cues a trainer would say during the lift. A proTips array for intermediate and advanced technique refinements.

Progressive overload guidance. A progressionPath field pointing to an easier variation and a harder variation. This lets the system suggest appropriate regressions for injured users and progressions as users advance.

Demonstration content. The existing EXERCISE_YOUTUBE_IDS map will be expanded to cover every exercise. For exercises without a suitable existing video, we will link to general movement tutorials. The long-term roadmap includes commissioning original video demonstrations featuring professional athletes filmed from multiple camera angles.

Search and filter metadata. Tags covering muscle focus, equipment type, difficulty, and movement pattern. A popularityScore derived from how often the exercise appears in generated programs, which we will track via analytics.

EXERCISE CATEGORIES TO BUILD OUT

We will organize the 300-exercise library across the following equipment and movement categories.

BARBELL MOVEMENTS — 45 exercises

Squat pattern: back-squat, front-squat, high-bar-squat, low-bar-squat, paused-squat, box-squat, safety-bar-squat, overhead-squat, zercher-squat, sumo-squat

Hinge pattern: conventional-deadlift, sumo-deadlift, romanian-deadlift, stiff-leg-deadlift, good-morning, rack-pull, deficit-deadlift, snatch-grip-deadlift, barbell-hip-thrust, barbell-glute-bridge

Horizontal push: barbell-bench-press, close-grip-bench-press, incline-barbell-press, decline-barbell-press, paused-bench-press, floor-press, barbell-push-press

Horizontal pull: barbell-bent-over-row, barbell-pendlay-row, barbell-yates-row, barbell-seal-row, t-bar-row

Vertical push: barbell-overhead-press, barbell-push-press, barbell-behind-neck-press

Vertical pull: barbell-shrug, barbell-upright-row

Isolation: barbell-curl, barbell-skull-crusher, barbell-reverse-curl, barbell-wrist-curl, barbell-lunge, barbell-reverse-lunge, barbell-step-up, barbell-calf-raise, barbell-good-morning, zercher-carry

DUMBBELL MOVEMENTS — 55 exercises

Squat and lunge pattern: dumbbell-goblet-squat, dumbbell-squat, dumbbell-sumo-squat, dumbbell-walking-lunge, dumbbell-reverse-lunge, dumbbell-lateral-lunge, dumbbell-step-up, dumbbell-bulgarian-split-squat, dumbbell-curtsy-lunge

Hinge pattern: dumbbell-romanian-deadlift, dumbbell-single-leg-rdl, dumbbell-hip-thrust, dumbbell-good-morning

Horizontal push: dumbbell-bench-press, dumbbell-incline-press, dumbbell-decline-press, dumbbell-floor-press, dumbbell-chest-fly, dumbbell-incline-fly, dumbbell-pullover, neutral-grip-dumbbell-press

Horizontal pull: dumbbell-bent-over-row, dumbbell-single-arm-row, dumbbell-chest-supported-row, dumbbell-rear-delt-row, dumbbell-seal-row

Vertical push: dumbbell-shoulder-press, arnold-press, dumbbell-lateral-raise, dumbbell-front-raise, dumbbell-upright-row, dumbbell-push-press

Vertical pull: dumbbell-shrug, dumbbell-snatch

Isolation: dumbbell-curl, hammer-curl, incline-dumbbell-curl, concentration-curl, zottman-curl, dumbbell-preacher-curl, dumbbell-tricep-extension, dumbbell-skull-crusher, dumbbell-kickback, dumbbell-calf-raise, dumbbell-wrist-curl, dumbbell-reverse-curl

Core: dumbbell-side-bend, dumbbell-woodchop, dumbbell-russian-twist

CABLE MACHINE MOVEMENTS — 35 exercises

Push: cable-chest-fly, cable-incline-fly, cable-decline-fly, cable-crossover, cable-tricep-pushdown, cable-overhead-tricep-extension, cable-tricep-kickback, cable-shoulder-press, cable-upright-row, cable-front-raise, cable-lateral-raise

Pull: cable-row, cable-lat-pulldown, cable-face-pull, straight-arm-pulldown, cable-pullover, cable-rear-delt-fly, cable-rope-row, cable-single-arm-lat-pulldown

Leg and hip: cable-pull-through, cable-hip-abduction, cable-hip-adduction, cable-kickback-glute, cable-leg-curl, cable-ankle-raise

Core: pallof-press, cable-woodchop, cable-crunch, cable-side-bend, cable-rotation, cable-reverse-crunch

Bicep: cable-curl, cable-hammer-curl, cable-concentration-curl, cable-reverse-curl

MACHINE MOVEMENTS — 30 exercises

Leg machines: leg-press, leg-extension, seated-leg-curl, lying-leg-curl, hack-squat, smith-machine-squat, smith-machine-rdl, seated-calf-raise, standing-calf-raise, hip-abduction-machine, hip-adduction-machine

Upper push machines: chest-press-machine, incline-chest-press-machine, decline-chest-press-machine, pec-deck, shoulder-press-machine, assisted-dip-machine

Upper pull machines: lat-pulldown-machine, seated-row-machine, assisted-pull-up-machine, rear-delt-pec-deck, t-bar-row-machine

Back machines: back-extension-machine, hyperextension, glute-ham-raise

Other: preacher-curl-machine, cable-curl-machine, tricep-pressdown-machine, ab-crunch-machine

BODYWEIGHT MOVEMENTS — 45 exercises

Push: push-up, wide-push-up, close-grip-push-up, decline-push-up, incline-push-up, pike-push-up, archer-push-up, pseudo-planche-push-up, diamond-push-up, explosive-push-up

Pull: pull-up, chin-up, neutral-grip-pull-up, wide-grip-pull-up, inverted-row, bodyweight-row, australian-pull-up, L-sit-pull-up

Press: dips, tricep-bench-dip, parallel-bar-dip, ring-dip

Squat and lunge: bodyweight-squat, jump-squat, walking-lunge, reverse-lunge, lateral-lunge, bulgarian-split-squat, pistol-squat, box-jump, step-up, lateral-step-up, curtsy-lunge

Hinge: glute-bridge, single-leg-glute-bridge, hip-thrust-bodyweight, nordic-hamstring-curl, good-morning-bodyweight

Core: plank, side-plank, RKC-plank, hollow-body-hold, dead-bug, bird-dog, mountain-climbers, hanging-leg-raise, knee-tuck, ab-wheel-rollout, pallof-press-bodyweight, L-sit

Conditioning: burpee, bear-crawl, inchworm, jumping-jack, high-knees

KETTLEBELL MOVEMENTS — 25 exercises

Swing pattern: kettlebell-swing, kettlebell-single-arm-swing, kettlebell-alternating-swing, kettlebell-sumo-deadlift-high-pull

Squat and lunge: kettlebell-goblet-squat, kettlebell-front-rack-squat, kettlebell-lunge, kettlebell-step-up, kettlebell-suitcase-squat

Hinge: kettlebell-romanian-deadlift, kettlebell-single-leg-rdl, kettlebell-hip-thrust, kettlebell-good-morning

Press: kettlebell-press, kettlebell-push-press, kettlebell-floor-press, kettlebell-windmill

Pull: kettlebell-row, kettlebell-single-arm-row, kettlebell-high-pull

Olympic and complex: kettlebell-clean, kettlebell-snatch, turkish-get-up, kettlebell-clean-and-press, kettlebell-halo

EZ BAR MOVEMENTS — 10 exercises

ez-bar-curl, ez-bar-preacher-curl, ez-bar-reverse-curl, ez-bar-skull-crusher, ez-bar-overhead-extension, ez-bar-upright-row, ez-bar-bent-over-row, ez-bar-close-grip-press, ez-bar-front-squat, ez-bar-drag-curl

RESISTANCE BAND MOVEMENTS — 20 exercises

band-pull-apart, band-face-pull, band-bicep-curl, band-tricep-pushdown, band-overhead-press, band-lateral-raise, band-front-raise, band-row, band-lat-pulldown, band-pull-through, band-hip-thrust, band-squat, band-monster-walk, band-clamshell, band-lateral-walk, band-glute-bridge, band-chest-press, band-chest-fly, band-pallof-press, band-woodchop

TRX AND SUSPENSION TRAINER — 15 exercises

trx-row, trx-fallout, trx-chest-press, trx-pushup, trx-bicep-curl, trx-tricep-extension, trx-squat, trx-lunge, trx-single-leg-squat, trx-hip-thrust, trx-plank, trx-pike, trx-mountain-climber, trx-hamstring-curl, trx-Y-fly

MOBILITY AND FLEXIBILITY — 20 exercises

hip-flexor-stretch, pigeon-pose, thoracic-rotation, world-greatest-stretch, cat-cow, child-pose-extended, lizard-pose, deep-squat-hold, ankle-circles, shoulder-circles, lat-stretch-doorway, pec-stretch, hamstring-stretch-standing, quad-stretch, calf-stretch-wall, couch-stretch, band-dislocates, foam-roll-quads, foam-roll-thoracic, foam-roll-lats

EXERCISE DEMONSTRATION STRATEGY

Every exercise will have at minimum a primary YouTube demo link. We will build the EXERCISE_YOUTUBE_IDS map to cover all 300 exercises using the best available instructional content from coaches including Jeff Nippard for science-based explanations, Alan Thrall for raw powerlifting technique, Jeremy Ethier for hypertrophy mechanics, Dr. Mike Israetel for volume and intensity guidance, and Squat University for corrective and mobility content.

The exercise detail page will be redesigned to show:

A full-width demo video section at the top with lazy loading.
A tabbed interface below with four tabs: How To, Common Mistakes, Variations, and Coach Cues.
An equipment substitute finder that shows three alternative exercises when the user taps Cannot do this.
A difficulty badge showing the exercise level.
A muscle activation diagram (initially implemented as a text-based visual showing which muscles are primary and secondary, with a future upgrade to an anatomical SVG map).
A record of the user's personal best on that exercise pulled from their workout history.
A related exercises section showing similar movements in the same pattern category.
A button linking to the full movement pattern library.

PART TWO — THE LEARNING SYSTEM

THE DUOLINGO VISION APPLIED TO FITNESS

Duolingo works because it makes learning feel like a game. Every session has a clear goal. Progress is visible. Rewards come frequently. Missing a day creates urgency. The social layer makes it competitive. We will apply every one of these mechanics to fitness education. The result is a learning system where users are motivated to open the app not just to log a workout but to earn XP, maintain their streak, complete a course, and beat their friends on the learning leaderboard.

GAMIFICATION LAYER

EXPERIENCE POINTS (XP). Every learning action earns XP. Completing a lesson earns 10 XP. Completing a quiz with a perfect score earns 20 XP. Completing a full module earns 50 XP. Completing a course earns 200 XP. Completing a workout earns 25 XP. Logging nutrition earns 5 XP. Getting a personal record earns 15 XP. The XP total determines the user's overall Omnexus Rank.

OMNEXUS RANK SYSTEM. Ranks create a progression narrative that rewards sustained engagement.

Rank 1 — Recruit (0 to 500 XP)
Rank 2 — Trainee (500 to 1500 XP)
Rank 3 — Athlete (1500 to 3500 XP)
Rank 4 — Competitor (3500 to 7000 XP)
Rank 5 — Elite (7000 to 12000 XP)
Rank 6 — Coach (12000 to 20000 XP)
Rank 7 — Master (20000 to 35000 XP)
Rank 8 — Legend (35000 plus XP)

Each rank unlocks new content, custom UI themes, and profile badges.

LEARNING STREAKS. Completing at least one lesson per day maintains the user's learning streak. The streak counter appears prominently in the app. At 7 days the user earns a Consistent Learner badge. At 30 days they earn a Knowledge Seeker badge. At 100 days they earn a Scholar badge. At 365 days they earn the Einstein badge which is the highest learning achievement. Missing a day offers a streak freeze mechanic where users can spend earned Sparks (the in-app currency) to protect their streak once per week.

SPARKS CURRENCY. Sparks are earned through consistent activity and spent on streak protection, hint unlocks during quizzes, and cosmetic profile customizations. Sparks are not purchasable with real money in v1. They are a pure engagement mechanic. Premium subscription users earn double Sparks.

COMBO MULTIPLIER. Answering quiz questions correctly in a row builds a combo. A 3-combo gives 1.25x XP. A 5-combo gives 1.5x XP. A 10-combo gives 2x XP. Breaking the combo resets to 1x. This makes quiz sessions feel exciting and rewards mastery.

DAILY LESSON CHALLENGE. Each day the app selects one specific lesson that awards triple XP if completed that day. The challenge rotates every 24 hours. This creates a daily check-in habit beyond workout logging.

ACHIEVEMENTS AND BADGES. The achievement system has three tiers.

Bronze achievements for early milestones: First Lesson, First Workout, First PR, First Perfect Quiz, First Week Streak, Explorer (visited all app sections).

Silver achievements for sustained engagement: 10 Workouts Logged, 30-Day Streak, First Course Completed, First Program Finished, Nutrition Tracker (7 consecutive nutrition logs), Social Butterfly (first friend added, first reaction given).

Gold achievements for mastery: 100 Workouts Logged, 365-Day Streak, All Courses Completed, 50 Personal Records, Ambassador (referred 5 friends), Legend Rank Reached.

Achievements display prominently on the profile page with earned date and a share card.

WEEKLY XP LEADERBOARD. Every week users compete with their friends on XP earned that week. The leaderboard resets every Monday. Top 3 users on your friends list earn special profile decorations for the week. This is separate from the workout leaderboard and rewards learning engagement.

COURSE ARCHITECTURE

The learning system will have five main categories of courses, each subdivided into modules of three to six lessons. Every lesson takes three to seven minutes to complete. Every module ends with a quiz. Every course ends with a comprehensive assessment.

CATEGORY ONE — FOUNDATIONS OF TRAINING

This is the beginner entry point. All new users are directed here first. It should feel welcoming and not overwhelming.

Course: How Your Body Gets Stronger
Modules: What Is Progressive Overload, How Muscles Actually Grow, The Role of Recovery, Sleep and Gains, Why Rest Days Are Training Days
Lessons per module: 3 to 4 short lessons
Assessment: 15-question quiz covering all modules

Course: Understanding Your Training Program
Modules: What Is a Training Split, Understanding Sets and Reps, What Is RPE and Why It Matters, Reading Your Program Card, How to Know When to Increase Weight

Course: Beginner Movement Mastery
Modules: The Hip Hinge (the most important movement pattern), The Squat Pattern, Pushing Patterns, Pulling Patterns, Core Stability vs Core Strength
Format: Each module is exercise-focused with video integration and guided self-assessment

CATEGORY TWO — NUTRITION SCIENCE

Course: Nutrition Fundamentals for Athletes
Modules: Calories Explained (not a diet, a measurement), The Three Macronutrients, Protein the Priority Nutrient, Carbohydrates as Fuel, Fat as Structure, Hydration and Performance

Course: Eating for Your Goal
Modules: Calorie Surplus for Muscle Building (how much is too much), Calorie Deficit for Fat Loss (preserving muscle), Maintenance Eating for Performance, Nutrient Timing Around Workouts, Pre-Workout Fueling, Post-Workout Recovery Nutrition

Course: Practical Nutrition Habits
Modules: Meal Prep for Busy Athletes, Reading a Nutrition Label, High Protein Foods You Actually Like, Managing Nutrition When Traveling, Social Eating and Staying on Track

Course: Supplements — Evidence and Reality
Modules: What Creatine Actually Does (with evidence), Protein Powder as Food Not Magic, Caffeine as a Performance Tool, What the Science Says About Popular Supplements, What You Do Not Need to Buy

CATEGORY THREE — EXERCISE SCIENCE

Course: Understanding Hypertrophy
Modules: Mechanical Tension vs Metabolic Stress, Muscle Fiber Types and Recruitment, Volume Landmarks (MEV MV MAV MRV explained simply), Frequency Myths and Facts, The Rep Range Spectrum

Course: Strength Development
Modules: Neural Adaptations vs Structural Adaptations, The Strength-Hypertrophy Continuum, Peaking and Tapering, Training for Maximal Strength vs Functional Strength, Powerlifting vs Olympic Lifting vs Bodybuilding

Course: Fat Loss Science
Modules: Why the Scale Lies, Body Recomposition and Who It Works For, NEAT and Why It Matters More Than Cardio, Cardio as a Tool Not a Punishment, Preserving Muscle During a Deficit

Course: Recovery and Adaptation
Modules: Supercompensation Explained, Active vs Passive Recovery, What Soreness Actually Means, The Deload Week and Why Smart Athletes Love It, Sleep Optimization for Athletes

Course: Program Design Principles
Modules: The Minimum Effective Dose, Block Periodization, Linear vs Undulating Progression, Managing Training Age, When to Hire a Coach

CATEGORY FOUR — MOVEMENT AND TECHNIQUE

Course: Squat Mastery
Modules: The Perfect Squat Anatomy, Bar Path and Stance Width, Depth and How to Achieve It, Common Errors and Corrections, Programming the Squat Across Experience Levels

Course: Deadlift Mastery
Modules: Conventional vs Sumo Debate, The Setup Ritual That Changes Everything, Bracing and Intra-Abdominal Pressure, Hip Hinge vs Leg Drive, Grip Variations and When to Use Straps

Course: Bench Press Mastery
Modules: The Arch Debate (natural vs extreme), Shoulder Safety and Positioning, Leg Drive and Full Body Tension, Grip Width and Bar Path, Spotter Communication and Safety

Course: Overhead Press Mastery
Modules: Shoulder Anatomy and Pressing, Bar Path for Overhead vs Push Press, Core Bracing for Overhead Work, Common Shoulder Injuries and Prevention, Programming Overhead Volume Safely

Course: Pull-Up and Row Mastery
Modules: Scapular Control Before Arm Strength, Full Range of Motion and Why It Matters, Lat Dominance vs Bicep Dominance, Programming Pulling Volume, Building from Zero to Your First Pull-Up

CATEGORY FIVE — MIND AND PERFORMANCE

Course: Training Psychology
Modules: The Identity of an Athlete, Motivation vs Discipline and When Each Matters, Managing Training Anxiety, Building Gym Confidence as a Beginner, Visualization and Mental Rehearsal

Course: Injury Prevention and Longevity
Modules: How Injuries Actually Happen, Listening to Your Body vs Pushing Through, Common Gym Injuries and How to Avoid Them, Training Around Pain vs Training Through Pain, Building a Decades-Long Training Career

Course: Goal Setting for Athletes
Modules: Outcome Goals vs Process Goals, The Hierarchy of Athletic Metrics, Short-Term and Long-Term Programming, Tracking Progress Beyond the Scale, Celebrating Non-Scale Victories

LESSON FORMAT DESIGN

Each lesson is a micro-interactive experience with the following structure.

HOOK. A single bold statement or question that creates curiosity. Example: Most people think soreness means growth. They are completely wrong.

KNOWLEDGE BLOCK. Two to four paragraphs of clear, jargon-free explanation. Written at a high school reading level. Uses real-world analogies. Example: Think of your muscle like a construction site. Soreness is just the cleanup crew. Growth happens after the cleanup is done.

INTERACTIVE CHECKPOINT. Midway through each lesson a knowledge check appears. This is not a formal quiz. It is a single question with two or three options. Getting it right gives a mini XP reward and continues. Getting it wrong shows a one-sentence explanation and continues.

KEY TAKEAWAYS. A bullet-point summary of the three most important concepts from the lesson. These become flashcard content for the spaced repetition system.

REAL WORLD APPLICATION. A single actionable instruction. Example: This week when you feel sore, skip the temptation to rest extra. Do a light movement session instead and notice how you feel.

SHARE CARD. An optional share card showing the lesson topic and a key quote the user can share to Instagram or friends. This is a passive growth mechanic.

QUIZ DESIGN

Module quizzes have 8 to 12 questions. Courses end with a 20-question comprehensive assessment. Question types will include:

Multiple choice with four options where one or two are traps that test true understanding versus surface memorization.

True or false with explanation — after answering, a one-sentence reason appears regardless of correctness.

Fill in the blank — a statement with one missing word selected from three options. Example: Progressive overload means consistently increasing training __________ over time. Options: stress, enjoyment, duration.

Order the steps — drag or tap to put steps in the correct sequence. Example: order the stages of muscle repair after training.

Image question (future phase) — identify a movement pattern from an image or diagram.

Failed quiz behavior: Users who score below 70 percent see the lessons they struggled with highlighted and are offered a Quick Retry with three questions focused on their weak points before attempting the full quiz again. This prevents frustration while enforcing mastery.

SPACED REPETITION SYSTEM

Key concepts from completed lessons will be surfaced again through a daily Review session. The review takes three to five minutes and resurfaces five to ten flashcard-style questions from previously completed content. The algorithm spaces repetition based on how confidently the user answered. Concepts answered perfectly multiple times are shown less frequently. Concepts answered incorrectly are shown more frequently. This is the same system used by Anki and adapted by Duolingo for their Word Review feature. The implementation lives in a new src/services/spacedRepetition.ts module.

LEARNING PATHS

Rather than showing users a flat list of all courses, the system routes users to a recommended learning path based on their training goal and experience level captured during onboarding.

Path A — The Beginner Foundation Path (for trainingAgeYears equals 0)
Starts with Foundations of Training, then Nutrition Fundamentals, then Beginner Movement Mastery. Unlocks additional courses one at a time to avoid overwhelming.

Path B — The Hypertrophy Specialist Path (for goal equals hypertrophy)
Starts with Understanding Hypertrophy, then Nutrition for Muscle Building, then the relevant technique mastery courses based on their program split.

Path C — The Fat Loss Path (for goal equals fat-loss)
Starts with Fat Loss Science, then Practical Nutrition Habits, then Recovery and Adaptation.

Path D — The Strength Path (for intermediate and advanced users pursuing strength)
Starts with Strength Development, then the movement mastery courses, then Program Design Principles.

Path E — The Longevity Path (for general-fitness users or older athletes)
Starts with Injury Prevention and Longevity, then Foundations of Training, then Training Psychology.

Paths can be switched at any time from the Learn page. The system remembers progress across all courses regardless of which path is active.

SOCIAL LEARNING FEATURES

Study Groups. Users can create or join a study group of up to 10 people. The group has a shared XP total and a weekly group challenge. Example group challenge: complete 5 lessons collectively this week. Completing the group challenge gives every member a bonus XP reward.

Knowledge Battles. Two users challenge each other to a timed 10-question quiz on a topic of their choice. The winner earns XP from the loser. The loser earns a smaller XP consolation prize for participating. Battles can only be initiated between friends.

Teach It Back. Once a user completes a course, they unlock the ability to write a brief explanation of the concept in their own words. Other users can rate this explanation as helpful. High-rated contributions earn Sparks and are featured in the community section.

GAMIFICATION DATABASE AND STATE

All XP, rank, streaks, achievements, and Sparks data will be stored in Supabase with real-time sync. The schema will include:

A user_xp table tracking total XP, current rank, weekly XP, and last activity date.
A user_streaks table tracking learning streak days, longest streak, last lesson date, and freeze tokens available.
A user_achievements table linking user IDs to achievement IDs with earned dates.
A user_sparks table tracking total Sparks balance, earned Sparks lifetime, and spent Sparks lifetime.
A learning_battles table tracking challenge sender, receiver, topic, scores, and outcome.

The AppContext reducer will be extended to handle XP updates, streak updates, and achievement unlocks so that UI celebrations can trigger immediately on the client without a round trip.

CELEBRATION MECHANICS

Every time a user earns a significant reward, the app should make them feel it.

Level up: a full-screen animated celebration with the new rank badge, a confetti burst, and a notification summary of what unlocked.

Perfect quiz: the screen flashes gold briefly, a 2x XP bonus is displayed, and the combo counter animates to the new total.

Streak milestone: at 7, 30, 100, and 365 days a special full-screen moment appears with the streak number displayed large and a share card generated automatically.

Achievement unlock: a toast notification rises from the bottom of the screen with the achievement icon, name, and XP reward. Tapping it opens the full achievement detail.

Personal record in a workout: the existing confetti mechanic (already implemented) triggers with an additional XP award overlay.

Course completion: a certificate-style completion screen with the course name, completion date, and a share button. The certificate is stored in the profile.

PART THREE — REVOLUTIONARY PRODUCT FEATURES

TRAINING DNA PROFILE

Every user has a Training DNA page accessible from their profile. This is a visual summary of who they are as an athlete built from their actual data. It shows their dominant movement patterns based on workout history. It shows their strongest muscle groups based on volume logs. It shows their learning profile including favorite topics and knowledge strengths. It shows their consistency pattern including which days of the week they train most. It shows their progression rate by comparing weight used in key exercises across time. The Training DNA is updated automatically each week and becomes a motivating artifact that users want to improve.

AI COACH PERSONA

The current Ask Omnexus feature is a general-purpose AI. We will evolve it into a named AI Coach with a defined personality. The coach is named Omni. Omni is direct, knowledgeable, and encouraging without being sycophantic. Omni remembers context from the conversation session, references the user's actual training profile, and gives advice that feels specific to this exact athlete rather than generic fitness advice.

Omni will have three modes accessible via the Ask page:

Coach Mode for training questions and program advice.
Science Mode for detailed physiological explanations backed by cited research from the RAG system.
Check-In Mode for a brief daily check-in conversation about how the user is feeling, their energy level, and any concerns.

Check-In Mode will feed data into the adaptation system so the program generator can suggest lighter training when the user reports fatigue, illness, or stress.

SMART PROGRESSIVE OVERLOAD RECOMMENDATIONS

After every workout the system analyzes the completed sets against the program plan. If the user completed all sets and reps with sets in reserve, the next session for that exercise will show a recommended weight increase. This recommendation will appear in the exercise block during the active workout with a yellow indicator showing the suggested load. The recommendation algorithm lives server-side via an extension of the existing adapt endpoint and considers training age, the exercise type, the rep range, and the historical rate of progression for that user on that movement.

PROGRAM CONTINUATION INTELLIGENCE

When a user finishes their 8-week block, the system does not simply end. A Progression Report is generated showing the user what they achieved across the 8 weeks including total volume per muscle group, personal records set, consistency percentage, and estimated strength gains. The report also includes an AI-generated narrative summary of the block written by Omni.

Below the report, a Continue Training button offers three options.

Option one: Build on this block — generate a new 8-week intensification block using the same exercises but higher intensities and different volume structures.

Option two: Change focus — update the training goal and regenerate a completely new 8-week program.

Option three: Deload week — generate a one-week active recovery program before the next block begins.

This makes the app feel like it has a multi-year training plan rather than a series of disconnected 8-week blocks.

BODY TRANSFORMATION TIMELINE

A new Timeline feature accessible from the profile shows a visual progression history combining multiple data streams: workout frequency per week charted as a heatmap calendar, weight lifted on key exercises as a trend line, body measurements as a trend line, bodyweight as a trend line, XP earned per week as a bar chart, and learning course completions as milestone markers. This single view tells the full story of the user's transformation journey and becomes a deeply personal artifact.

EXERCISE DISCOVERY ENGINE

Instead of a flat list in the library, the exercise browser becomes an intelligent discovery system.

You can browse by Movement Pattern to find every horizontal push or every hinge in the database.

You can browse by Muscle with a visual muscle map where tapping a muscle shows all exercises that train it.

You can browse by Equipment to see exactly what you can do with what you have.

You can browse by Difficulty to find beginner-friendly movements or elite challenges.

You can use the Equipment Swap feature where you select an exercise you love and the system shows three alternatives for different equipment setups.

The search also features a natural language mode powered by the existing RAG system. A user can type things like best exercises for upper back with no barbell and get semantically relevant results rather than keyword-matched ones.

COACH NOTES SYSTEM

Each day in the active workout includes a Coach Notes section that Omni generates before the workout begins. Coach notes are personalized to the current week of the program, the user's recent performance, and any feedback they have given. A Week 3 coach note might say: This is your volume peak week. You should be feeling the work accumulate. Focus on technique over load today and trust the process. Week 4 is a deload and you will feel significantly stronger going into week 5. These notes are generated as part of the program structure and not through an additional AI call.

PART FOUR — TECHNICAL ARCHITECTURE FOR REVOLUTIONARY FEATURES

EXPANDED TYPE SYSTEM

The MuscleGroup type will be expanded to include: lats, traps, rhomboids, rear-deltoid, front-deltoid, side-deltoid, rotator-cuff, serratus, obliques, erectors, hip-flexors, adductors, abductors, tibialis. This gives the program generator and volume tracking system much higher resolution on muscle group targeting.

The Equipment type will be expanded to include: ez-bar, smith-machine, trap-bar, suspension-trainer, dip-bars, rings. This allows the program generator to correctly restrict and substitute exercises based on specific equipment availability.

A new Difficulty type from 1 to 5 will be added to exercise entries and used by the program generator to filter exercises appropriate for the user's experience level.

GAMIFICATION DATABASE SCHEMA

Six new Supabase tables will be required for the learning and gamification system.

user_xp stores userId, totalXp, weeklyXp, currentRank, weeklyXpResetsAt.
learning_streaks stores userId, currentStreak, longestStreak, lastLessonDate, freezeTokens.
achievements stores an achievement catalogue with id, name, description, tier, xpReward, iconName.
user_achievements stores userId, achievementId, earnedAt.
user_sparks stores userId, totalSparks, earnedLifetime, spentLifetime.
xp_events stores userId, eventType, xpAmount, description, createdAt. This is the event log that feeds analytics and gives users a history of how they earned their XP.

LEARNING CONTENT MANAGEMENT

Rather than hardcoding learning content in static files, the content will be structured in a JSON format in the src/data/courses/ directory. Each course is a separate file. This makes content easy to add, edit, and eventually migrate to a CMS without changing the application code. The LessonPage component reads from this structured data. The search and recommendation system indexes the content. The spaced repetition system references lesson IDs from these files.

PART FIVE — SPRINT SCHEDULE FOR THE FULL VISION

SPRINT A — EXERCISE LIBRARY EXPANSION TO 150 EXERCISES

Implement the first 90 new exercises across barbell, dumbbell, cable, machine, bodyweight, and kettlebell categories. Expand MuscleGroup and Equipment types. Update EXERCISE_IDS and classification sets. Add YouTube demo IDs. Verify build passes. Target: 150 total exercises with all TypeScript errors resolved.

SPRINT B — EXERCISE LIBRARY COMPLETION TO 300 EXERCISES

Implement the remaining 150 exercises covering EZ bar, resistance band, TRX, Smith machine, mobility, and the remaining bodyweight variations. Redesign the ExerciseDetailPage with the tabbed layout including How To, Common Mistakes, Variations, and Coach Cues sections. Implement the Equipment Swap feature. Add the progressive difficulty field to all exercises. Target: 300 total exercises with the new detail page design.

SPRINT C — GAMIFICATION FOUNDATION

Create the six new Supabase database tables. Build the XP event system in the AppContext reducer. Implement the Rank system with visual rank badge components. Build the Streak tracker component. Add XP rewards to existing actions: workout completion, lesson completion, PR celebration. Build the Achievement catalogue. Target: XP, rank, and streaks visible in the app with rewards triggering on key actions.

SPRINT D — LEARNING CONTENT PHASE ONE

Write Foundations of Training and Nutrition Fundamentals courses in the structured JSON format. Build the new lesson reader component with hook, knowledge block, interactive checkpoint, key takeaways, and real world application sections. Build the quiz engine supporting multiple choice, true or false, and fill in the blank question types. Build the combo multiplier and quiz XP system. Build the Daily Lesson Challenge feature. Target: Two complete courses playable end to end with gamification working.

SPRINT E — LEARNING CONTENT PHASE TWO

Write Exercise Science, Movement Mastery, and Mind and Performance courses. Implement the Learning Path routing system that directs users to a recommended path based on their training profile. Build the Spaced Repetition review session. Build the course completion certificate screen. Target: All five course categories represented with at least one course each. Learning paths working for all five profile types.

SPRINT F — SOCIAL LEARNING AND KNOWLEDGE BATTLES

Build Study Groups with shared XP tracking. Build the Knowledge Battle system with the timed quiz challenge and result tracking. Build the Teach It Back feature with community rating. Integrate the weekly XP leaderboard with the learning system. Target: All social learning features functional between test accounts.

SPRINT G — AI COACH EVOLUTION

Evolve the Ask page into the named Omni coach interface with Coach Mode, Science Mode, and Check-In Mode. Build the Check-In Mode data pipeline that feeds fatigue and wellness signals into the adaptation system. Implement Coach Notes generation as part of program structure. Build the Smart Progressive Overload recommendation overlay in the active workout screen. Target: Omni feels like a named AI coach with persistent personality and context.

SPRINT H — TRAINING DNA AND TRANSFORMATION TIMELINE

Build the Training DNA profile page with all five data visualizations. Build the Body Transformation Timeline combining workout, measurement, weight, XP, and learning data. Build the Program Continuation Intelligence flow including the Progression Report and three continuation options. Target: The profile section tells the full story of the user's training journey.

SPRINT I — EXERCISE DISCOVERY ENGINE

Build the muscle map browser. Build the movement pattern browser. Build the equipment filter browser. Build the natural language search for exercises using the existing RAG infrastructure. Build the Equipment Swap recommendation feature. Target: The exercise library feels like a premium discovery platform, not a flat list.

SPRINT J — CELEBRATION MECHANICS AND POLISH

Build all celebration animations: rank up full screen, perfect quiz gold flash, streak milestone full screen, achievement toast, course completion certificate. Build the share card generator for courses, achievements, and learning streaks. Conduct a comprehensive mobile UX review across all new features. Target: Every major accomplishment in the app has a moment that makes the user feel great and want to share it.

SPRINT K — PRODUCTION HARDENING AND V1 RELEASE

Security audit of all new endpoints. E2E test coverage for all new user flows. Performance review of the spaced repetition algorithm and database query patterns. Documentation update for all new systems. Vercel production environment configuration. Smoke test on production URL. Target: V1 release with 300 exercises, a full gamified learning system, AI coach, training DNA, and continuous training programs.

DOCUMENTATION TO PRODUCE

docs/learning-system.md will describe the full course architecture, gamification mechanics, XP calculation rules, spaced repetition algorithm, and database schema for the learning features.

docs/exercise-library.md will describe the 300-exercise database structure, classification system, how equipment filtering works in program generation, and the exercise discovery engine design.

docs/gamification.md will describe the XP system, rank thresholds, streak mechanics, achievement catalogue, Sparks currency, and the events log.

docs/ai-coach.md will describe Omni's personality definition, the three operating modes, the Check-In Mode data pipeline, and the Coach Notes generation system.

docs/program-continuation.md will describe the Progression Report generation, the three continuation options, and how program chaining works in the database.

All existing documentation will be updated to reflect the expanded system.

CLOSING STATEMENT

This plan describes a fitness application that does not yet exist in the market. Current leaders like MyFitnessPal track food. Peloton sells hardware. Centr sells celebrity. Whoop sells data. None of them combine intelligent personalized program generation, a deeply gamified fitness education system, a named AI coach with persistent context, and a social learning layer in a single cohesive product.

Omnexus can own this space. The technical foundation is already strong. The architecture is sound. The AI integrations are working. What the plan adds is a complete product vision that makes the app genuinely addictive and genuinely valuable to both beginners and serious athletes simultaneously.

The plan is organized into eleven sprints. Each sprint delivers meaningful, shippable functionality. Implementation begins with Sprint A immediately.