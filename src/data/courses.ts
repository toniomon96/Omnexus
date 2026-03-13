import type { Course } from '../types';

const detailedCourses: Course[] = [
  // ─── Course 1: Foundations of Strength Training ───────────────────────────
  {
    id: 'strength-foundations',
    title: 'Foundations of Strength Training',
    description:
      'Learn the core principles that underpin all effective resistance training — from progressive overload to recovery — grounded in exercise science.',
    category: 'strength-training',
    difficulty: 'beginner',
    estimatedMinutes: 45,
    relatedGoals: ['hypertrophy', 'general-fitness'],
    tags: ['progressive overload', 'hypertrophy', 'periodization', 'RPE'],
    coverEmoji: '🏋️',
    modules: [
      // ── Module 1: Progressive Overload ──────────────────────────────────────
      {
        id: 'progressive-overload',
        title: 'Progressive Overload',
        lessons: [
          {
            id: 'po-core-principle',
            title: 'The Core Principle',
            estimatedMinutes: 5,
            content: `Progressive overload is the most fundamental principle in strength and muscle development. Put simply: gradually increase the demand placed on your muscles over time so the body must keep adapting.

The physiological basis comes from Hans Selye's General Adaptation Syndrome (GAS). When a new stress is applied, the body passes through three stages — alarm (initial shock), resistance (adaptation), and exhaustion (if overloaded without recovery). Intelligent training applies enough stress to trigger adaptation without pushing into exhaustion.

In practice, performing 3 sets of 10 at 60 kg every session indefinitely will eventually stop producing results because the stimulus is no longer novel. The body is remarkably efficient — it adapts precisely to what it is asked to do, and no more.

Research by Schoenfeld (2010) confirms that progressive increases in training volume and load are the primary drivers of both strength gains (via neural adaptations) and hypertrophy (via structural changes in muscle fiber size and cross-sectional area).`,
            keyPoints: [
              'Progressive overload means continuously challenging muscles beyond their current capacity.',
              'Without increasing challenge, the body stops adapting — a state called accommodation.',
              'Both load (weight) and volume (sets × reps) can be progressed.',
              'Adaptations include neural efficiency gains (strength) and muscle fiber growth (hypertrophy).',
            ],
            references: [
              {
                title:
                  'The Mechanisms of Muscle Hypertrophy and Their Application to Resistance Training',
                authors: 'Schoenfeld BJ',
                journal: 'Journal of Strength and Conditioning Research',
                year: 2010,
                url: 'https://pubmed.ncbi.nlm.nih.gov/20847704/',
                type: 'journal',
              },
              {
                title:
                  'ACSM Position Stand: Progression Models in Resistance Training for Healthy Adults',
                authors: 'Kraemer WJ, Adams K, Cafarelli E, et al.',
                journal: 'Medicine & Science in Sports & Exercise',
                year: 2002,
                url: 'https://pubmed.ncbi.nlm.nih.gov/11828249/',
                type: 'guideline',
              },
            ],
          },
          {
            id: 'po-how-to-apply',
            title: 'How to Apply Progressive Overload',
            estimatedMinutes: 5,
            content: `There are several ways to apply progressive overload. Understanding them gives flexibility to keep progressing even when one pathway stalls.

**1. Increase load (weight).** The most straightforward approach — add weight to the bar. For beginners, linear progression (adding small amounts each session) is highly effective. Typical guidance suggests adding 2–5% to compound lifts once you hit the top of your rep range across all sets.

**2. Increase reps at the same load.** Work from 3 × 8 up to 3 × 12 before increasing weight. This double progression method — extend reps, then add load — is practical and sustainable.

**3. Increase sets (volume).** Adding a set raises total training volume (sets × reps × weight). A meta-analysis by Krieger (2010) found a clear dose-response relationship between volume and hypertrophy — more sets produce more growth, up to a recoverable threshold.

**4. Improve technique and range of motion.** Executing a lift through full range of motion increases the stretch stimulus and mechanical tension on muscle tissue — both proven drivers of hypertrophy. Cleaner technique qualifies as genuine progression.

For all of this to work, tracking a training log (sets, reps, loads per session) is the single most important habit. You can only beat what you can measure.`,
            keyPoints: [
              'Progressive overload can be applied via load, reps, sets, density, or technique.',
              'Double progression: extend reps to the top of a target range, then increase load.',
              'A training log is essential — you can only beat your previous performance if you recorded it.',
              'Volume has a dose-response relationship with hypertrophy up to maximum recoverable volume.',
            ],
            references: [
              {
                title:
                  'Single vs. Multiple Sets of Resistance Exercise for Muscle Hypertrophy: A Meta-Analysis',
                authors: 'Krieger JW',
                journal: 'Journal of Strength and Conditioning Research',
                year: 2010,
                url: 'https://pubmed.ncbi.nlm.nih.gov/20093963/',
                type: 'meta-analysis',
              },
            ],
          },
        ],
        quiz: {
          id: 'po-quiz',
          questions: [
            {
              id: 'po-q1',
              question:
                'What happens when a training stimulus stays the same week after week?',
              options: [
                'Muscle growth accelerates because the muscles become more efficient',
                'Adaptation slows and eventually plateaus — the body stops needing to change',
                'Strength decreases because the muscles atrophy without new stimulus',
                'Recovery improves because the body grows accustomed to the stress',
              ],
              correctIndex: 1,
              explanation:
                "The body adapts precisely to the demands placed on it. Once it has adapted to a given stimulus, there is no new signal to trigger further change — this is called accommodation. Progressive overload exists specifically to prevent it.",
            },
            {
              id: 'po-q2',
              question:
                'Which of the following best describes "double progression"?',
              options: [
                'Increasing the weight every session regardless of reps completed',
                'Training each muscle group twice per week',
                'Working from 3 × 8 up to 3 × 12 at the same weight, then increasing the load',
                'Reducing rest times while keeping load and volume constant',
              ],
              correctIndex: 2,
              explanation:
                'Double progression means first extending reps to the top of a target range (e.g., 8–12), then increasing load and returning to the lower end. It is a practical, sustainable model for managing progression.',
            },
            {
              id: 'po-q3',
              question:
                'Which approach provides the most direct evidence of progressive overload over time?',
              options: [
                'Measuring bodyweight daily',
                'Rating how hard each session felt (1–10)',
                'Keeping a detailed training log with sets, reps, and loads',
                'Tracking the number of different exercises per session',
              ],
              correctIndex: 2,
              explanation:
                'A training log is the most direct way to verify consistent progressive overload. Without tracking, it is easy to unknowingly stagnate. You can only beat your previous performance if you know what it was.',
            },
          ],
        },
      },

      // ── Module 2: Rep Ranges ─────────────────────────────────────────────────
      {
        id: 'rep-ranges',
        title: 'Rep Ranges & Muscle Adaptations',
        lessons: [
          {
            id: 'rr-continuum',
            title: 'The Rep Range Continuum',
            estimatedMinutes: 6,
            content: `Different rep ranges drive different physiological adaptations — though there is far more overlap than traditionally thought.

**Low reps (1–5): Strength and neural adaptations.** Heavy, low-rep training primarily drives improvements in motor unit recruitment, firing rate, and inter-muscular coordination. These neural adaptations happen quickly and explain why beginners get much stronger before they look visibly bigger.

**Moderate reps (6–12): The hypertrophy sweet spot (historically).** This range balances sufficient mechanical tension with enough metabolic stress and time under tension to drive hypertrophic signaling. For decades it was considered uniquely optimal for muscle building.

**High reps (15–30+): Metabolic stress and muscular endurance.** Higher reps with lighter loads elevate metabolic stress and cell swelling. A landmark 2017 meta-analysis by Schoenfeld et al. found that, when sets are taken close to failure, moderate and high rep ranges produce similar hypertrophy — challenging the idea that 6–12 is uniquely superior.

**The practical takeaway:** For hypertrophy, a broad rep range (5–30) trained close to failure is effective. For maximal strength, lower-rep heavier loading is more specific. Most well-designed programs include a mix.`,
            keyPoints: [
              'Low reps (1–5) primarily develop maximal strength through neural adaptations.',
              'Moderate (6–12) and high (15–30) reps produce similar hypertrophy when trained close to failure.',
              'Proximity to failure matters more than the specific rep range for building muscle.',
              'A variety of rep ranges provides both strength and hypertrophy stimuli.',
            ],
            references: [
              {
                title:
                  'Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-Analysis',
                authors: 'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW',
                journal: 'Journal of Strength and Conditioning Research',
                year: 2017,
                url: 'https://pubmed.ncbi.nlm.nih.gov/28834797/',
                type: 'meta-analysis',
              },
            ],
          },
          {
            id: 'rr-rpe',
            title: 'Training Intensity with RPE',
            estimatedMinutes: 4,
            content: `RPE — Rate of Perceived Exertion — quantifies how hard a set feels relative to your maximum. In resistance training it is typically expressed on a 1–10 scale, where 10 is absolute failure and 8 means roughly 2 reps left in reserve (also expressed as RIR: Reps In Reserve).

Research by Helms et al. (2016) validated that trained individuals can accurately self-regulate intensity using RPE, and that training consistently in the RPE 7–9 range (1–3 RIR) is effective for both strength and hypertrophy while managing fatigue and injury risk.

Training to absolute failure every set is not necessary and accumulates excess fatigue. Conversely, leaving 5+ reps in reserve significantly reduces the hypertrophic stimulus. The evidence supports the idea that "effective reps" — those closest to failure — drive the most adaptation.

For practical application: beginners should stay at RPE 7–8 while learning technique. Intermediate and advanced trainees can incorporate more RPE 8–9 work, with occasional sets to failure used strategically.`,
            keyPoints: [
              'RPE 10 = absolute failure; RPE 8 = 2 reps left in reserve (2 RIR).',
              'Training in the RPE 7–9 range balances hypertrophic stimulus with fatigue management.',
              'Sets closest to failure ("effective reps") are believed to drive the most hypertrophic signal.',
              'Beginners should prioritize technique at lower RPE before pushing high intensities.',
            ],
            references: [
              {
                title:
                  'Rating of Perceived Exertion as a Method of Volume Autoregulation Within a Periodized Program',
                authors: 'Helms ER, Cronin J, Storey A, Zourdos MC',
                journal: 'Strength and Conditioning Journal',
                year: 2016,
                url: 'https://pubmed.ncbi.nlm.nih.gov/26891420/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'rr-quiz',
          questions: [
            {
              id: 'rr-q1',
              question:
                'According to recent meta-analyses, what is the most important variable for building muscle across different rep ranges?',
              options: [
                'Using a weight that is exactly 70–80% of your 1-rep max',
                'Performing exactly 3 sets of 8–12 reps per exercise',
                'Training close to failure, regardless of rep range',
                'Resting exactly 60–90 seconds between sets',
              ],
              correctIndex: 2,
              explanation:
                'Schoenfeld et al. (2017) showed light, moderate, and heavy loads produce similar hypertrophy when sets are taken close to failure. Proximity to failure — not a specific rep count — is the key driver of the hypertrophic stimulus.',
            },
            {
              id: 'rr-q2',
              question: 'An RPE of 8 during a set means:',
              options: [
                'The set felt moderate and you stopped with 5+ reps left',
                'You reached complete muscular failure on the last rep',
                'You finished the set with approximately 2 reps left in reserve',
                'Your heart rate was at 80% of maximum during the set',
              ],
              correctIndex: 2,
              explanation:
                'On the RIR-based RPE scale, RPE 8 = 2 reps in reserve. You could have completed 2 more reps before technical failure. This intensity is within the recommended RPE 7–9 range for most working sets.',
            },
            {
              id: 'rr-q3',
              question:
                'Which rep range is most appropriate for developing maximum strength expression?',
              options: [
                'High reps (15–30) to maximize metabolic stress',
                'Low reps (1–5) with heavy loads',
                'Moderate reps (8–12) to balance strength and hypertrophy',
                'All rep ranges produce identical maximal strength gains',
              ],
              correctIndex: 1,
              explanation:
                'Low-rep heavy training is most specific to maximal strength because it drives the neural adaptations — motor unit recruitment and rate coding — that most directly improve 1RM force output. Higher rep training still builds strength, but low-rep training is more specific to that quality.',
            },
          ],
        },
      },

      // ── Module 3: Recovery ───────────────────────────────────────────────────
      {
        id: 'recovery-adaptation',
        title: 'Recovery & the Adaptation Cycle',
        lessons: [
          {
            id: 'ra-sra',
            title: 'The Stimulus–Recovery–Adaptation Cycle',
            estimatedMinutes: 6,
            content: `Every time you train, you are not directly building muscle in the gym — you are creating the stimulus that triggers adaptation during recovery. Understanding this cycle is essential to structuring effective training.

**Stimulus.** Training creates micro-damage to muscle fibers and depletes energy substrates. This disruption triggers biochemical signals — including mTOR pathway activation and satellite cell recruitment — that initiate repair and growth.

**Recovery.** In the hours and days after training, the body repairs damaged tissue, replenishes glycogen stores, and synthesizes new muscle protein. This is where actual gains occur. Recovery requires adequate sleep, protein, and calories.

**Adaptation (Supercompensation).** If recovery is complete, repaired tissue is slightly stronger or larger than before — the body "over-shoots" its previous baseline to better handle future stress. This is supercompensation, and it is the fundamental mechanism behind long-term training progress.

Timing matters: retraining too early compounds fatigue and impairs adaptation. Too late and the supercompensation window closes, returning you to baseline. Optimal frequency aims to restimulate the muscle while supercompensation is still elevated. Research suggests training each muscle group twice per week is an effective minimum.`,
            keyPoints: [
              'Gains occur during recovery, not during the workout itself.',
              'Sleep, protein, and caloric sufficiency are the raw materials for adaptation.',
              'Supercompensation: the body rebuilds tissue slightly above its previous baseline.',
              'Retraining too early accumulates fatigue; too late and supercompensation fades.',
              'Training each muscle 2× per week is an evidence-based minimum frequency for hypertrophy.',
            ],
            references: [
              {
                title:
                  'Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis',
                authors: 'Schoenfeld BJ, Ogborn D, Krieger JW',
                journal: 'Sports Medicine',
                year: 2016,
                url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/',
                type: 'meta-analysis',
              },
            ],
          },
        ],
        quiz: {
          id: 'ra-quiz',
          questions: [
            {
              id: 'ra-q1',
              question: 'When do muscles actually grow and strengthen?',
              options: [
                'During the workout, as fibers are being challenged under load',
                'Immediately after the final set of the session',
                'During recovery periods between training sessions',
                'Only during deep sleep on the night of the workout',
              ],
              correctIndex: 2,
              explanation:
                'Muscle growth occurs during recovery — not during the workout. Training provides the stimulus (mechanical tension, micro-damage, metabolic stress). Recovery — sleep, protein, calories — provides the conditions for protein synthesis and adaptation to occur.',
            },
            {
              id: 'ra-q2',
              question: 'What is "supercompensation" in the context of training?',
              options: [
                'Performing more volume than recommended to speed up gains',
                'The body adapting to a stress level slightly above its previous baseline',
                'Adding supplements to accelerate the recovery process',
                'Training two muscle groups in the same session to save time',
              ],
              correctIndex: 1,
              explanation:
                "Supercompensation is the phenomenon where, after a training stimulus and adequate recovery, the body rebuilds itself slightly above its previous baseline — becoming marginally stronger or more capable than before. It's the foundation of all long-term training progress.",
            },
            {
              id: 'ra-q3',
              question:
                'Research suggests training each muscle group at least how often per week for optimal hypertrophy?',
              options: [
                'Once per week (one dedicated session per muscle group)',
                'Twice per week (2 sessions targeting each muscle group)',
                'Every day — daily stimulation maximizes the growth signal',
                'Three or more times — anything less produces minimal adaptation',
              ],
              correctIndex: 1,
              explanation:
                'A meta-analysis by Schoenfeld et al. (2016) found training each muscle 2× per week produces superior hypertrophy compared to 1× per week when volume is equated. Daily training of the same muscle groups is generally impractical and risks insufficient recovery.',
            },
          ],
        },
      },
    ],
  },

  // ─── Course 2: Nutrition Foundations ─────────────────────────────────────
  {
    id: 'nutrition-foundations',
    title: 'Nutrition 101',
    description:
      'Understand the science behind what you eat — macronutrients, energy balance, and evidence-based strategies for performance and body composition.',
    category: 'nutrition',
    difficulty: 'beginner',
    estimatedMinutes: 40,
    relatedGoals: ['hypertrophy', 'fat-loss', 'general-fitness'],
    tags: ['protein', 'calories', 'macros', 'energy balance'],
    coverEmoji: '🥗',
    modules: [
      // ── Module 1: Macronutrients ──────────────────────────────────────────────
      {
        id: 'macronutrients',
        title: 'The Three Macronutrients',
        lessons: [
          {
            id: 'macro-protein',
            title: 'Protein: The Building Block',
            estimatedMinutes: 5,
            content: `Protein is made up of amino acids — the structural units of muscle tissue, enzymes, and hormones. When you eat protein, it is digested into amino acids and used to build and repair tissue based on the body's current needs.

For people who train, protein serves two critical roles: providing substrate (amino acids) for muscle protein synthesis (MPS), and being highly satiating, which helps manage total caloric intake.

How much do you actually need? Older RDA guidelines (0.8 g/kg/day) were designed to prevent deficiency in sedentary populations — not to optimize body composition. For individuals engaged in regular resistance training, research consistently supports intakes of **1.6–2.2 g per kg of body weight per day** as optimal for maximizing MPS.

A landmark meta-analysis by Morton et al. (2018) analyzed 49 studies and found that protein intakes beyond approximately 1.62 g/kg/day produced no further significant gains in fat-free mass. For a practical safety margin, targeting 2.0 g/kg is reasonable and well-tolerated.

Distribution also matters. Research by Moore et al. (2009) suggests 0.25–0.40 g/kg of protein per meal optimally stimulates MPS. Spreading protein across 4–5 meals may modestly outperform consuming the same total in 1–2 large servings.`,
            keyPoints: [
              'Protein provides amino acids for muscle protein synthesis (MPS) and is highly satiating.',
              'The RDA (0.8 g/kg) is for sedentary populations — active individuals benefit from more.',
              'Research supports 1.6–2.2 g/kg/day for those doing regular resistance training.',
              'Spreading protein across 4–5 meals per day may modestly improve MPS stimulation.',
            ],
            references: [
              {
                title:
                  'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength',
                authors: 'Morton RW, Murphy KT, McKellar SR, et al.',
                journal: 'British Journal of Sports Medicine',
                year: 2018,
                url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/',
                type: 'meta-analysis',
              },
              {
                title:
                  'Ingested protein dose response of muscle and albumin protein synthesis after resistance exercise',
                authors: 'Moore DR, Robinson MJ, Fry JL, et al.',
                journal: 'American Journal of Clinical Nutrition',
                year: 2009,
                url: 'https://pubmed.ncbi.nlm.nih.gov/19056590/',
                type: 'journal',
              },
            ],
          },
          {
            id: 'macro-carbs',
            title: 'Carbohydrates: Fuel for Performance',
            estimatedMinutes: 5,
            content: `Carbohydrates are the body's preferred fuel for high-intensity activity. After digestion, glucose is either used immediately or stored as glycogen in the liver and muscles. Muscle glycogen is the primary fuel for resistance training and most forms of intense exercise.

**Glycogen and performance.** Research consistently shows that muscle glycogen availability directly impacts training performance. Low glycogen states reduce volume capacity, power output, and mental focus during sessions. For active individuals, adequate carbohydrate intake supports better training quality — which drives better long-term adaptations.

**Protein sparing.** When carbohydrate intake is adequate, the body preferentially uses glucose for energy rather than converting protein via gluconeogenesis. This "protein-sparing" effect means more dietary protein reaches muscle tissue for repair and growth.

**Insulin and nutrient partitioning.** Carbohydrates stimulate insulin secretion, which facilitates glucose uptake into muscle cells and helps shuttle amino acids into muscle tissue — amplifying the anabolic effect of post-exercise nutrition.

For most active individuals, evidence-based guidance supports 3–7 g/kg/day of carbohydrates, with higher intakes appropriate during periods of intensive training. The type of carbohydrate matters far less than total intake and meal timing relative to training.`,
            keyPoints: [
              'Muscle glycogen — stored carbohydrate — is the primary fuel for resistance training.',
              'Low glycogen states impair volume capacity, strength output, and focus.',
              'Adequate carbohydrates "spare" protein for muscle repair and synthesis.',
              'Active individuals typically benefit from 3–7 g/kg/day, varying with training load.',
            ],
            references: [
              {
                title:
                  'International Society of Sports Nutrition Position Stand: Nutrient Timing',
                authors: 'Kerksick CM, Arent S, Schoenfeld BJ, et al.',
                journal: 'Journal of the International Society of Sports Nutrition',
                year: 2017,
                url: 'https://pubmed.ncbi.nlm.nih.gov/28919842/',
                type: 'guideline',
              },
            ],
          },
          {
            id: 'macro-fats',
            title: 'Dietary Fat: Essential, Not the Enemy',
            estimatedMinutes: 4,
            content: `Dietary fat has been vilified and rehabilitated multiple times in public health messaging. The current scientific consensus is more nuanced: fat is essential, and cutting it too low has clear consequences.

**Hormonal health.** Dietary fat — particularly saturated and monounsaturated fat — is necessary for testosterone and other steroid hormone production. Studies have shown that very low-fat diets (below ~15% of calories from fat) are associated with reduced testosterone levels, which can impair muscle building and recovery.

**Cell membrane integrity.** Every cell in the body has a lipid bilayer membrane. Adequate fat intake — especially omega-3 fatty acids — supports membrane fluidity, anti-inflammatory signaling, and overall cell function.

**Fat-soluble vitamins.** Vitamins A, D, E, and K require dietary fat for absorption. Fat-deficient diets risk deficiency in these critical micronutrients.

For most active individuals, targeting **20–35% of total calories from fat** is well-supported, with an emphasis on minimally processed sources: olive oil, nuts, avocado, and fatty fish for omega-3s. Partially hydrogenated oils (trans fats) should be minimized given their clear cardiovascular risk.`,
            keyPoints: [
              'Fat is essential for hormone production, cell membrane health, and fat-soluble vitamin absorption.',
              'Very low-fat diets (<15% of calories) are associated with reduced testosterone in men.',
              'Omega-3 fatty acids (fatty fish, flaxseed) support anti-inflammatory signaling and recovery.',
              'Target 20–35% of total calories from fat, prioritizing whole-food sources.',
            ],
            references: [
              {
                title:
                  'Diet and serum sex hormones in healthy men',
                authors: 'Hamalainen E, Adlercreutz H, Puska P, Pietinen P',
                journal: 'Journal of Steroid Biochemistry',
                year: 1984,
                url: 'https://pubmed.ncbi.nlm.nih.gov/6538617/',
                type: 'journal',
              },
              {
                title: 'Dietary Guidelines for Americans 2020–2025',
                authors: 'U.S. Dept. of Agriculture and HHS',
                year: 2020,
                url: 'https://www.dietaryguidelines.gov/',
                type: 'guideline',
              },
            ],
          },
        ],
        quiz: {
          id: 'macro-quiz',
          questions: [
            {
              id: 'macro-q1',
              question:
                'What protein intake does research support for individuals doing regular resistance training?',
              options: [
                '0.8 g/kg/day — the standard dietary RDA',
                '1.6–2.2 g/kg/day — based on muscle protein synthesis research',
                '3.0–4.0 g/kg/day — more protein always produces more muscle',
                'Protein intake has no significant effect on muscle building',
              ],
              correctIndex: 1,
              explanation:
                'Morton et al. (2018) found that protein intakes of ~1.62 g/kg/day maximized fat-free mass gains from training. The standard RDA of 0.8 g/kg prevents deficiency in sedentary populations — it was not designed to optimize performance or body composition.',
            },
            {
              id: 'macro-q2',
              question:
                'Why are carbohydrates particularly important for resistance training performance?',
              options: [
                'They convert directly into protein in the body, supporting muscle repair',
                'Muscle glycogen (stored carbohydrate) is the primary fuel for high-intensity lifting',
                'Carbohydrates suppress cortisol, reducing muscle breakdown during training',
                'They reduce the body\'s need for dietary protein by providing nitrogen',
              ],
              correctIndex: 1,
              explanation:
                'Muscle glycogen is the predominant fuel for resistance training. Low glycogen impairs volume capacity, power output, and focus. Adequate carbohydrates support better training quality, which drives better long-term adaptations.',
            },
            {
              id: 'macro-q3',
              question:
                'Very low-fat diets (below ~15% of calories from fat) are associated with:',
              options: [
                'Improved muscle protein synthesis due to reduced fat oxidation',
                'Better cardiovascular health due to lower saturated fat intake',
                'Reduced testosterone levels, particularly in men',
                'No significant hormonal or performance effects',
              ],
              correctIndex: 2,
              explanation:
                'Dietary fat is required for steroid hormone synthesis including testosterone. Research has shown very low-fat diets are associated with reduced testosterone, which can impair muscle building, recovery, and energy levels.',
            },
          ],
        },
      },

      // ── Module 2: Energy Balance ──────────────────────────────────────────────
      {
        id: 'energy-balance',
        title: 'Energy Balance & Caloric Needs',
        lessons: [
          {
            id: 'eb-calories',
            title: 'The Law of Energy Balance',
            estimatedMinutes: 5,
            content: `Energy balance is the fundamental equation governing body composition: calories consumed versus calories expended. Despite endless debate over optimal macronutrient ratios and meal timing, all controlled research confirms that total energy balance is the primary determinant of weight gain or loss.

**Energy in.** Calories come from protein (4 kcal/g), carbohydrates (4 kcal/g), and fat (9 kcal/g). Alcohol provides 7 kcal/g but serves no nutritional role.

**Energy out — the four components of TDEE:**
**1. Basal Metabolic Rate (BMR)** — energy to sustain life at rest (~60–70% of TDEE).
**2. Thermic Effect of Food (TEF)** — energy to digest and metabolize food (~10%).
**3. Exercise Activity Thermogenesis (EAT)** — deliberate exercise (~15–30%).
**4. Non-Exercise Activity Thermogenesis (NEAT)** — all movement outside formal exercise (walking, fidgeting, posture). Highly variable between individuals — can differ by up to 2,000 kcal/day.

**Caloric surplus and deficit.** To gain muscle, a modest surplus (200–500 kcal above maintenance) provides energy for new tissue synthesis. To lose fat, a deficit is required. Note that metabolic adaptation occurs during prolonged restriction — BMR decreases and NEAT often drops unconsciously — which is why fat loss typically requires progressive adjustments over time.`,
            keyPoints: [
              'Total caloric balance is the primary determinant of weight gain or loss.',
              'TDEE = BMR + TEF + EAT + NEAT; NEAT is the most variable component.',
              'A modest surplus (200–500 kcal) supports muscle gain with minimal fat accumulation.',
              'A caloric deficit is required for fat loss; size of deficit affects rate and muscle retention.',
              'Metabolic adaptation (reduced BMR and NEAT) occurs during prolonged caloric restriction.',
            ],
            references: [
              {
                title: 'Adaptive thermogenesis in humans',
                authors: 'Rosenbaum M, Leibel RL',
                journal: 'International Journal of Obesity',
                year: 2010,
                url: 'https://pubmed.ncbi.nlm.nih.gov/20935667/',
                type: 'journal',
              },
            ],
          },
          {
            id: 'eb-tdee',
            title: 'Estimating Your Caloric Needs',
            estimatedMinutes: 5,
            content: `Estimating your Total Daily Energy Expenditure (TDEE) is the starting point for any nutrition strategy. No formula is perfectly accurate — individual metabolic variation is real — but evidence-based equations provide a reliable starting point.

**Step 1: Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation** (most validated for most populations):
Men: BMR = (10 × kg) + (6.25 × cm) − (5 × age) + 5
Women: BMR = (10 × kg) + (6.25 × cm) − (5 × age) − 161

**Step 2: Apply an activity multiplier:**
Sedentary (desk job, no exercise): BMR × 1.2
Lightly active (exercise 1–3 days/week): BMR × 1.375
Moderately active (exercise 3–5 days/week): BMR × 1.55
Very active (hard training 6–7 days/week): BMR × 1.725

**Step 3: Set caloric target based on goal:**
Maintenance: TDEE
Lean bulking: TDEE + 200–300 kcal
Muscle building: TDEE + 300–500 kcal
Fat loss: TDEE − 300–500 kcal (aggressive: up to −750 kcal)

**Important:** These are estimates. Track your weekly average bodyweight (same conditions each morning) and adjust calories by 100–200 kcal every 1–2 weeks based on observed trends. Real-world data beats any equation.`,
            keyPoints: [
              'The Mifflin-St Jeor equation is the most validated BMR formula for most individuals.',
              'Multiply BMR by an activity factor (1.2–1.725) to estimate TDEE.',
              'Add 200–500 kcal for muscle gain; subtract 300–500 kcal for fat loss.',
              'Formulas are estimates — track weekly bodyweight trends and adjust every 2 weeks.',
            ],
            references: [
              {
                title:
                  'A new predictive equation for resting energy expenditure in healthy individuals',
                authors: 'Mifflin MD, St Jeor ST, Hill LA, et al.',
                journal: 'American Journal of Clinical Nutrition',
                year: 1990,
                url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'eb-quiz',
          questions: [
            {
              id: 'eb-q1',
              question:
                'Which component of TDEE is most variable between individuals?',
              options: [
                'Basal Metabolic Rate (BMR)',
                'Thermic Effect of Food (TEF)',
                'Exercise Activity Thermogenesis (EAT)',
                'Non-Exercise Activity Thermogenesis (NEAT)',
              ],
              correctIndex: 3,
              explanation:
                'NEAT — energy from all non-exercise movement like walking, fidgeting, and posture — varies by up to 2,000 kcal/day between individuals. It is a major reason why two people with similar BMRs and exercise habits can have very different caloric needs.',
            },
            {
              id: 'eb-q2',
              question:
                'For someone trying to build muscle with minimal fat gain, what caloric surplus is generally recommended?',
              options: [
                'As large as possible — more calories always means more muscle',
                'A modest surplus of 200–300 kcal above TDEE',
                '1,000–2,000 kcal — a large surplus accelerates the process',
                'No surplus is needed; training alone drives muscle growth',
              ],
              correctIndex: 1,
              explanation:
                "A modest 200–300 kcal surplus (a \"lean bulk\") provides sufficient substrate for muscle protein synthesis while minimizing fat accumulation. Larger surpluses beyond what muscle tissue can use are stored as fat — muscle growth has a physiological ceiling that excess calories can't bypass.",
            },
            {
              id: 'eb-q3',
              question:
                'Your TDEE estimate is 2,400 kcal, but you gain weight eating 2,200 kcal. What should you do?',
              options: [
                "Trust the formula — the weight gain must be muscle",
                'Eat significantly less to create a much larger deficit',
                'Accept the formula overestimated your TDEE and adjust your target downward',
                'Add more exercise to compensate for the formula error',
              ],
              correctIndex: 2,
              explanation:
                "Formulas are estimates — individual metabolic rates vary. When real-world bodyweight data contradicts the formula, the data wins. Adjust your target by 100–200 kcal every 1–2 weeks and re-observe. This empirical, iterative approach is more reliable than any equation.",
            },
          ],
        },
      },
    ],
  },
];

// ─── Course Scaffolds (Sprint E will populate remaining content) ──────────────

const courseScaffolds: Course[] = [
  // ── Foundations (3 more — Sprint D) ───────────────────────────────────────
  {
    id: 'recovery-science',
    title: 'Recovery & Sleep Science',
    description: 'Understand how sleep, stress management, and active recovery drive adaptation and performance.',
    category: 'recovery',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    relatedGoals: ['hypertrophy', 'general-fitness'],
    tags: ['sleep', 'recovery', 'cortisol', 'HRV'],
    coverEmoji: '😴',
    modules: [
      // ── Module 1: Sleep & Adaptation ──────────────────────────────────────
      {
        id: 'sleep-adaptation',
        title: 'Sleep & Training Adaptation',
        lessons: [
          {
            id: 'rs-sleep-why',
            title: 'Why Sleep Is Non-Negotiable',
            estimatedMinutes: 5,
            content: `Sleep is the single most powerful recovery tool available — and it costs nothing. During slow-wave sleep (SWS), the pituitary gland releases the majority of the day's growth hormone, which drives muscle protein synthesis, tissue repair, and fat metabolism.

Research from the Stanford Sleep Research Center by Cheri Mah et al. (2011) found that extending sleep to 10 hours per night in basketball players produced measurable improvements in sprint times, shooting accuracy, and reaction time. Conversely, even one night of partial sleep deprivation (< 6 hours) impairs protein synthesis rates, elevates cortisol, and reduces testosterone — the hormonal environment for adaptation shifts sharply negative.

The NSCA recommends 7–9 hours for adults engaged in regular resistance training. Athletes and those in high-volume training phases may benefit from 9–10 hours. The practical rule: if you're setting an alarm, you may not be getting enough sleep.

**Slow-wave sleep and REM sleep both matter.** SWS dominates the first half of the night and drives physical repair. REM sleep — concentrated in the second half — consolidates motor learning and procedural memory (how to perform lifts correctly). Cutting a night short by 90 minutes significantly shortens REM duration.`,
            keyPoints: [
              'Growth hormone secretion peaks during slow-wave sleep — cutting sleep short blunts muscle repair.',
              'One night of < 6 hours raises cortisol, lowers testosterone, and impairs protein synthesis.',
              'REM sleep consolidates motor learning — critical for technique refinement.',
              'Target 7–9 hours; athletes in high-volume phases benefit from 9–10.',
            ],
            references: [
              {
                title: 'The Effects of Sleep Extension on the Athletic Performance of Collegiate Basketball Players',
                authors: 'Mah CD, Mah KE, Kezirian EJ, Dement WC',
                journal: 'Sleep',
                year: 2011,
                url: 'https://pubmed.ncbi.nlm.nih.gov/21731144/',
                type: 'journal',
              },
            ],
          },
          {
            id: 'rs-sleep-quality',
            title: 'Optimising Sleep Quality',
            estimatedMinutes: 5,
            content: `Sleep duration is necessary but not sufficient — quality (sleep architecture) matters too. Fragmented sleep with frequent awakenings reduces time in restorative SWS and REM regardless of total hours in bed.

**Temperature.** Core body temperature must drop ~1–1.5°C to initiate sleep. A bedroom temperature of 16–19°C (60–67°F) is optimal. A warm shower 1–2 hours before bed paradoxically accelerates sleep onset by causing rapid peripheral heat loss afterward.

**Light.** Blue-wavelength light (from screens, LED lighting) suppresses melatonin secretion — the signal that tells the body it's dark and time to sleep. Bright overhead lights in the evening delay circadian rhythm. Dimming lights and removing blue light exposure 60–90 minutes before bed significantly reduces sleep latency.

**Consistency.** The circadian rhythm operates on a 24-hour clock synchronized to light exposure. Consistent wake times — even on weekends — are the most effective anchor for circadian alignment. Variable sleep schedules (social jet lag) create the same cortisol dysregulation as crossing time zones.

**Caffeine.** Caffeine has a half-life of approximately 5–7 hours. A 200 mg dose at 2 pm still leaves ~100 mg active at 7 pm — enough to increase nighttime wakefulness and reduce SWS. Cutting off caffeine by early-mid afternoon protects sleep architecture.`,
            keyPoints: [
              'Bedroom temperature 16–19°C optimises sleep initiation by facilitating core cooling.',
              'Blue light before bed suppresses melatonin; dim lights 60–90 minutes before sleep.',
              'A consistent wake time is the strongest circadian anchor — including weekends.',
              'Caffeine cut-off in early afternoon protects slow-wave sleep.',
            ],
            references: [
              {
                title: 'Sleep and Human Aging',
                authors: 'Mander BA, Winer JR, Walker MP',
                journal: 'Neuron',
                year: 2017,
                url: 'https://pubmed.ncbi.nlm.nih.gov/28384471/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'sleep-quiz',
          questions: [
            {
              id: 'slq-1',
              question: 'When does the majority of daily growth hormone release occur?',
              options: [
                'During intense resistance training sets',
                'Immediately after eating a high-protein meal',
                'During slow-wave sleep (deep sleep) at night',
                'In the first 30 minutes after waking',
              ],
              correctIndex: 2,
              explanation: 'Growth hormone is primarily secreted in pulses during slow-wave sleep (SWS), especially in the first half of the night. This is why sleep is the key window for muscle repair and anabolic recovery.',
            },
            {
              id: 'slq-2',
              question: 'Which type of sleep is most important for motor learning and technique consolidation?',
              options: [
                'Slow-wave sleep (SWS)',
                'REM sleep',
                'Light sleep (stage 1–2)',
                'All stages contribute equally',
              ],
              correctIndex: 1,
              explanation: 'REM sleep — concentrated in the second half of the night — is when the brain consolidates procedural and motor memories. Cutting a night short typically reduces REM disproportionately, impairing technique learning.',
            },
            {
              id: 'slq-3',
              question: 'What is the optimal bedroom temperature range for sleep?',
              options: [
                '22–25°C (72–77°F) — warm and comfortable',
                '10–14°C (50–57°F) — cold room, warm duvet',
                '16–19°C (60–67°F) — cool environment',
                'Temperature has no meaningful effect on sleep quality',
              ],
              correctIndex: 2,
              explanation: 'Core body temperature must drop ~1°C to initiate sleep. A cool room of 16–19°C facilitates this drop. A room that is too warm impairs the transition into deep sleep and increases nighttime awakenings.',
            },
          ],
        },
      },

      // ── Module 2: Recovery Strategies ─────────────────────────────────────
      {
        id: 'recovery-strategies',
        title: 'Stress, Cortisol & Active Recovery',
        lessons: [
          {
            id: 'rs-cortisol',
            title: 'Stress, Cortisol & Training Adaptation',
            estimatedMinutes: 5,
            content: `Cortisol is often portrayed as a purely negative hormone — but this is an oversimplification. Acute cortisol spikes during training are normal and facilitate energy mobilisation, immune function, and alertness. The problem arises with chronically elevated cortisol, which actively opposes the anabolic environment needed for adaptation.

**The allostatic load.** The body does not distinguish between sources of stress. Work deadlines, relationship conflict, financial pressure, poor sleep, and training volume all draw from the same stress-response pool. An athlete managing high life stress should consider reducing training volume — not adding more.

**Cortisol and muscle protein balance.** Cortisol promotes proteolysis (muscle breakdown) and inhibits protein synthesis. Chronically elevated cortisol suppresses testosterone and growth hormone, directly impairing hypertrophy. Studies measuring salivary cortisol in athletes show that overreaching (excessive training volume without adequate recovery) produces sustained cortisol elevation lasting weeks.

**Practical management.** Deload weeks (a planned 40–50% reduction in volume every 4–8 weeks) allow systemic stress to resolve. Monitoring subjective markers — training motivation, morning mood, resting heart rate, and sleep quality — provides early warning of accumulation before it becomes overtraining syndrome.`,
            keyPoints: [
              'Acute cortisol spikes during training are normal; chronically high cortisol impairs adaptation.',
              'All stressors — physical and psychological — deplete the same systemic stress budget.',
              'Cortisol promotes muscle breakdown and suppresses testosterone and growth hormone.',
              'Deload weeks and subjective monitoring are the primary tools for managing allostatic load.',
            ],
            references: [
              {
                title: 'Neuroendocrine Responses and Adaptations to Strength and Power Training',
                authors: 'Kraemer WJ, Ratamess NA',
                journal: 'Sports Medicine',
                year: 2005,
                url: 'https://pubmed.ncbi.nlm.nih.gov/15831061/',
                type: 'journal',
              },
            ],
          },
          {
            id: 'rs-active-recovery',
            title: 'Active Recovery: What Actually Works',
            estimatedMinutes: 5,
            content: `Active recovery refers to low-intensity movement performed on rest days or after hard training sessions. The evidence on active recovery is more nuanced than popular belief suggests — some methods have real benefit; others have little effect.

**What works:**
**Light aerobic movement** (walking, easy cycling, light swimming at < 60% max HR) increases blood flow, enhances metabolite clearance, and can reduce muscle soreness (DOMS) perception without adding meaningful training stress.

**Cold water immersion (CWI)** — ice baths or cold showers — reduces acute inflammation and DOMS perception. However, research by Roberts et al. (2015) found that regular CWI blunts hypertrophic signalling by suppressing satellite cell activity and mTOR pathway activation. Use sparingly if hypertrophy is the goal; more appropriate for competition phases where rapid recovery between sessions matters.

**Foam rolling / soft-tissue work** reduces perceived soreness and transiently improves range of motion through neurological mechanisms. The effect on actual tissue repair is negligible, but reduced perception of tightness may improve subsequent session quality.

**What doesn't work:** Passive rest alone is not "active recovery" and does not accelerate metabolite clearance. Sauna use post-exercise may feel restorative but the evidence for accelerating structural recovery is weak.`,
            keyPoints: [
              'Light aerobic movement on rest days enhances blood flow and reduces DOMS perception.',
              'Cold water immersion reduces soreness but may blunt hypertrophy if used chronically.',
              'Foam rolling reduces perceived tightness via neurological effects — not tissue repair.',
              'The best recovery strategy combines sleep, sufficient protein, and managed training stress.',
            ],
            references: [
              {
                title: 'Post-exercise cold water immersion attenuates acute anabolic signalling',
                authors: 'Roberts LA, Raastad T, Markworth JF, et al.',
                journal: 'Journal of Physiology',
                year: 2015,
                url: 'https://pubmed.ncbi.nlm.nih.gov/26174323/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'recovery-strat-quiz',
          questions: [
            {
              id: 'rsq-1',
              question: 'Regular cold water immersion may blunt muscle growth because it:',
              options: [
                'Reduces blood flow to muscles for up to 24 hours',
                'Suppresses satellite cell activity and mTOR signalling',
                'Lowers body temperature, reducing protein synthesis rates',
                'Cold immersion has no effect on hypertrophy',
              ],
              correctIndex: 1,
              explanation: 'Research by Roberts et al. (2015) found that post-exercise cold water immersion suppresses satellite cell activity and mTOR pathway activation — the cellular machinery driving muscle growth. It may benefit recovery speed in competition phases but is counterproductive for maximising hypertrophy.',
            },
            {
              id: 'rsq-2',
              question: 'Chronically elevated cortisol negatively affects muscle growth primarily by:',
              options: [
                'Reducing appetite, leading to insufficient protein intake',
                'Increasing heart rate, making training less efficient',
                'Promoting muscle breakdown and suppressing anabolic hormones',
                'Blocking glucose uptake in muscle cells',
              ],
              correctIndex: 2,
              explanation: 'Chronically elevated cortisol promotes proteolysis (muscle protein breakdown) and suppresses both testosterone and growth hormone secretion. This creates a sustained catabolic environment that directly opposes hypertrophic adaptation.',
            },
            {
              id: 'rsq-3',
              type: 'true-false',
              question: 'Performing light aerobic activity (walking, easy cycling) on rest days can reduce delayed onset muscle soreness (DOMS) without significantly adding to training stress.',
              options: ['True', 'False'],
              correctIndex: 0,
              explanation: 'True. Light aerobic movement at under 60% max HR increases blood flow and promotes metabolite clearance, reducing the perception of DOMS — without the intensity needed to accumulate meaningful additional training stress.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'mobility-flexibility',
    title: 'Mobility & Flexibility',
    description: 'A systematic approach to joint mobility, tissue extensibility, and movement quality.',
    category: 'mobility',
    difficulty: 'beginner',
    estimatedMinutes: 40,
    relatedGoals: ['general-fitness'],
    tags: ['mobility', 'flexibility', 'range of motion', 'warmup'],
    coverEmoji: '🤸',
    modules: [
      // ── Module 1: Understanding Mobility ──────────────────────────────────
      {
        id: 'mobility-basics',
        title: 'Understanding Mobility',
        lessons: [
          {
            id: 'mob-vs-flex',
            title: "Mobility vs Flexibility — What's the Difference?",
            estimatedMinutes: 5,
            content: `Mobility and flexibility are often used interchangeably, but they describe distinct qualities with different training implications.

**Flexibility** is the passive range of motion of a muscle or joint — how far a limb can be moved when no muscular force is applied (e.g., a partner stretching your hamstring). Flexibility is a tissue property.

**Mobility** is the active, usable range of motion — the range through which you can move with control and strength. You can be flexible without being mobile: a hypermobile person who cannot control end-range positions is injury-prone precisely because they lack the strength to stabilise extreme positions.

The training goal is **mobile strength** — range of motion that is both available and under neuromuscular control. This is what translates to safer, more effective lifting.

**Why it matters for lifting.** Deep squat mobility allows a more upright torso and less spinal loading. Hip mobility affects hip hinge mechanics in the deadlift. Thoracic mobility determines how safely you can overhead press. Deficiencies in joint mobility create compensations upstream and downstream in the kinetic chain — the famous "joint-by-joint" model by Gray Cook and Mike Boyle describes how restricted joints force adjacent joints to become hypermobile, predisposing them to injury.`,
            keyPoints: [
              'Flexibility = passive range of motion. Mobility = active, controlled range of motion.',
              'Hypermobility without neuromuscular control increases injury risk.',
              'The goal is mobile strength — range of motion with control and stability.',
              'Mobility restrictions in one joint force compensations at adjacent joints.',
            ],
            references: [
              {
                title: 'Movement: Functional Movement Systems',
                authors: 'Cook G',
                journal: 'On Target Publications',
                year: 2010,
                url: 'https://functionalmovement.com/',
                type: 'guideline',
              },
            ],
          },
          {
            id: 'mob-principles',
            title: 'Principles of Mobility Training',
            estimatedMinutes: 5,
            content: `Effective mobility training follows a few core principles that distinguish it from simple static stretching.

**1. Progressive overload applies.** Like strength training, mobility adapts to progressive stimulus. Consistently working at the limit of your comfortable range — and gradually pushing that edge — is more effective than the same stretches performed at the same range indefinitely.

**2. Neurological vs structural change.** Most acute gains from stretching are neurological — the nervous system relaxes its protective tone. Sustained structural change (actual tissue lengthening) requires consistent practice over weeks to months. Stretching once a week produces minimal lasting change.

**3. End-range strengthening.** The most durable mobility gains come from strengthening muscles in their lengthened positions. This signals to the nervous system that the range is safe to access. Exercises like the Romanian deadlift (hamstrings under load at length) or the deep squat with heel elevation develop end-range strength.

**4. Frequency over duration.** 10 minutes of mobility work 5× per week produces more adaptation than 50 minutes once a week, because connective tissue responds to consistent stimulation rather than infrequent overload.

**5. Warm tissue is more extensible.** Mobility work is more effective after a general warm-up (5–10 minutes light aerobic activity) than cold. Dynamic stretching (controlled movement through range) is preferable to static stretching before a training session, as static stretching immediately before can transiently reduce force production.`,
            keyPoints: [
              'Progressive overload applies to mobility — gradually push range limits.',
              'Most acute stretch gains are neurological; structural change takes weeks of consistency.',
              'Strengthening muscles at end range produces the most durable mobility gains.',
              '10 min × 5 days beats 50 min × 1 day for connective tissue adaptation.',
            ],
            references: [
              {
                title: 'A Review of the Acute Effects of Static and Dynamic Stretching on Performance',
                authors: 'Behm DG, Chaouachi A',
                journal: 'European Journal of Applied Physiology',
                year: 2011,
                url: 'https://pubmed.ncbi.nlm.nih.gov/21373870/',
                type: 'meta-analysis',
              },
            ],
          },
        ],
        quiz: {
          id: 'mob-basics-quiz',
          questions: [
            {
              id: 'mbq-1',
              question: 'Which best defines "mobility" in the context of movement training?',
              options: [
                'The maximum range of motion achievable when a partner assists the stretch',
                'Active range of motion with neuromuscular control and strength',
                'The total length of a muscle measured from origin to insertion',
                'The flexibility of tendons and ligaments around a joint',
              ],
              correctIndex: 1,
              explanation: 'Mobility is active, controllable range of motion — the range through which you can move under your own muscular control. Flexibility is the passive range when no active force is applied. Mobility = flexibility + control.',
            },
            {
              id: 'mbq-2',
              question: 'Why is static stretching immediately before lifting generally not recommended?',
              options: [
                'It raises core temperature too much, increasing injury risk',
                'It can transiently reduce force production in the stretched muscles',
                'Static stretching shortens muscle fibres before training',
                'It increases joint laxity permanently, reducing stability',
              ],
              correctIndex: 1,
              explanation: 'Research shows acute static stretching (especially > 30–60 seconds) can transiently reduce maximal force output by 5–8% in the stretched muscle. Dynamic warm-up and mobility drills are preferred pre-session; static stretching is better placed post-session or in a dedicated mobility block.',
            },
            {
              id: 'mbq-3',
              type: 'true-false',
              question: 'Performing 10 minutes of mobility work five days per week is generally more effective than 50 minutes once per week.',
              options: ['True', 'False'],
              correctIndex: 0,
              explanation: 'True. Connective tissue (tendons, ligaments, fascia) responds better to frequent, consistent stimulation than infrequent overload. Regular short sessions maintain the adaptive signal throughout the week, producing greater long-term range of motion gains.',
            },
          ],
        },
      },

      // ── Module 2: Practical Mobility Work ─────────────────────────────────
      {
        id: 'mobility-practice',
        title: 'The Warm-Up Blueprint & Key Drills',
        lessons: [
          {
            id: 'mob-warmup',
            title: 'The Warm-Up Blueprint',
            estimatedMinutes: 5,
            content: `A well-structured warm-up does three things: raises tissue temperature, activates neuromuscular patterns specific to the session ahead, and addresses the mobility limitations most relevant to the day's training.

**Phase 1 — General warm-up (3–5 min).** Light cardio (row, bike, skip, brisk walk) to elevate heart rate, increase blood flow, and raise tissue temperature. Warm muscle is more extensible and neurons fire more efficiently. Never skip this phase.

**Phase 2 — Targeted mobility (5–8 min).** Address the joints that will be under load in the session. For a squat session: hip flexors (couch stretch or lunge with rotation), hip internal rotation (90/90 stretch), ankle dorsiflexion (wall ankle mobilisation). For pressing: thoracic extension, shoulder external rotation. Use dynamic movements rather than long static holds at this stage.

**Phase 3 — Activation (3–5 min).** Activate the muscles that tend to be inhibited — commonly glutes, scapular stabilisers, and core. Banded clamshells for hip abductors, face pulls for scapular retractors, dead bugs for core. This "turns on" the muscles before they are needed.

**Phase 4 — Specific warm-up sets.** Perform 2–3 progressively heavier sets of the main movement at reduced load (e.g., bar only, then 50%, then 70% before working sets). This rehearses the movement pattern and primes the CNS.

The total warm-up time is 15–20 minutes. Cutting corners on the warm-up is a false economy — it is where injury prevention happens.`,
            keyPoints: [
              'Phase 1: general aerobic warm-up to raise tissue temperature.',
              'Phase 2: targeted dynamic mobility for the joints being loaded.',
              'Phase 3: activation of inhibited muscles (glutes, scapular stabilisers, core).',
              'Phase 4: specific warm-up sets in the main movement.',
            ],
            references: [
              {
                title: 'The Effect of a Warm-Up on Physical Performance: A Systematic Review',
                authors: 'Fradkin AJ, Zazryn TR, Smoliga JM',
                journal: 'Journal of Strength and Conditioning Research',
                year: 2010,
                url: 'https://pubmed.ncbi.nlm.nih.gov/20072040/',
                type: 'meta-analysis',
              },
            ],
          },
          {
            id: 'mob-key-drills',
            title: 'Key Mobility Drills for Lifters',
            estimatedMinutes: 5,
            content: `The following mobility areas are the most commonly limited in people who train with weights and the most impactful to address.

**Hip flexors.** Prolonged sitting shortens hip flexors (psoas, rectus femoris), pulling the pelvis into anterior tilt and limiting hip extension — essential for the deadlift lockout, sprint mechanics, and upright squat posture. The couch stretch (knee against wall, hip into extension) is one of the most effective tools. 2 × 60 seconds per side daily is a practical starting point.

**Ankle dorsiflexion.** Limited ankle ROM is the most common reason trainees cannot achieve a full-depth squat with heels flat. The talus must glide posteriorly to allow the shin to move forward. Wall ankle mobilisations (knee tracking over the 4th toe toward the wall) address this specific restriction. If a heel raise resolves the problem, ankle mobility is the limiting factor.

**Thoracic spine extension.** A stiff thoracic spine limits overhead pressing, causes excessive lumbar extension as compensation, and impairs scapular mechanics. Foam rolling thoracic extension over a roller (segmental extension across the roller, moving it up the spine) restores extension. Thoracic rotation — seated twists with arms across chest — improves rotation for unilateral pressing and rotational sports.

**Hip internal rotation.** Many lifters lack internal rotation, which forces the knees to cave inward during the squat (valgus collapse). The 90/90 stretch — sitting with both hips at 90° and alternating between internal and external rotation — is highly effective for developing hip rotational range.`,
            keyPoints: [
              'Hip flexor restriction causes anterior pelvic tilt, limiting hip extension and squat depth.',
              'Ankle dorsiflexion limits are the most common cause of limited squat depth with heels flat.',
              'Thoracic stiffness forces lumbar compensation during pressing and overhead movements.',
              'Hip internal rotation deficits contribute to knee valgus collapse during the squat.',
            ],
            references: [
              {
                title: 'Muscle imbalances and the importance of functional assessment in rehabilitation of athletes',
                authors: 'Page P',
                journal: 'International Journal of Sports Physical Therapy',
                year: 2011,
                url: 'https://pubmed.ncbi.nlm.nih.gov/21655453/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'mob-practice-quiz',
          questions: [
            {
              id: 'mpq-1',
              question: 'If a lifter can achieve a full-depth squat with their heels raised on a plate, but not with heels flat, what is most likely the limiting factor?',
              options: [
                'Weak glutes and quadriceps',
                'Poor thoracic spine mobility',
                'Limited ankle dorsiflexion range of motion',
                'Tight hip flexors pulling the pelvis into anterior tilt',
              ],
              correctIndex: 2,
              explanation: 'Heel elevation compensates for limited ankle dorsiflexion by shifting the angle required at the ankle. When the problem resolves with a heel raise, ankle dorsiflexion is the primary restriction. Wall ankle mobilisations (knee to wall) address this directly.',
            },
            {
              id: 'mpq-2',
              question: 'What is the correct order of a well-structured training warm-up?',
              options: [
                'Activation → Specific warm-up sets → General cardio → Targeted mobility',
                'Targeted mobility → General cardio → Activation → Specific warm-up sets',
                'General cardio → Targeted mobility → Activation → Specific warm-up sets',
                'Specific warm-up sets → General cardio → Targeted mobility → Activation',
              ],
              correctIndex: 2,
              explanation: 'The correct sequence is: general cardio (raise tissue temperature) → targeted dynamic mobility (prepare specific joints) → activation (turn on inhibited muscles) → specific warm-up sets (rehearse the movement). Skipping the cardio phase means performing mobility work on cold tissue, which reduces effectiveness.',
            },
            {
              id: 'mpq-3',
              question: 'Thoracic spine stiffness most commonly causes problems during which movements?',
              options: [
                'Romanian deadlifts and leg press',
                'Barbell back squat and calf raises',
                'Overhead pressing and front squat',
                'Seated cable rows and lat pulldown',
              ],
              correctIndex: 2,
              explanation: 'Thoracic extension is required for safe overhead pressing (the ribcage must extend to allow the arms to reach vertical). In the front squat, a stiff thoracic spine prevents an upright torso position, causing the elbows to drop and the bar to shift forward. These movements require the most thoracic mobility.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'cardio-conditioning',
    title: 'Cardio & Conditioning',
    description: 'Heart rate zones, energy systems, and how to programme endurance work alongside strength training.',
    category: 'cardio',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    relatedGoals: ['fat-loss', 'general-fitness'],
    tags: ['cardio', 'VO2max', 'HIIT', 'zone 2'],
    coverEmoji: '🏃',
    modules: [
      // ── Module 1: Energy Systems & Heart Rate ──────────────────────────────
      {
        id: 'energy-systems',
        title: 'Energy Systems & Heart Rate Zones',
        lessons: [
          {
            id: 'cc-energy-systems',
            title: 'The Three Energy Systems',
            estimatedMinutes: 5,
            content: `All physical activity is fuelled by ATP (adenosine triphosphate) — the universal energy currency of cells. The body has three overlapping systems to regenerate ATP from food, each dominant at different durations and intensities.

**1. Phosphocreatine (PCr) system — 0 to 10 seconds.** The fastest system; uses stored creatine phosphate to regenerate ATP without oxygen. Powers maximal-effort sprints, Olympic lifts, and throws. Depletes rapidly — a 100m sprint nearly exhausts PCr stores. Replenished fully within 3–5 minutes of rest.

**2. Glycolytic system — 10 seconds to ~2 minutes.** Breaks down glucose (from blood or stored glycogen) to produce ATP without oxygen (anaerobic glycolysis). Also produces lactate — not the cause of the "burn" (that is hydrogen ions), but a useful energy substrate. Dominant during 400m runs, short HIIT intervals, and sets of 10–20 reps close to failure.

**3. Oxidative (aerobic) system — 2 minutes and beyond.** Uses oxygen to completely oxidise carbohydrates and fats. Highly efficient — can produce far more ATP per substrate molecule than the other systems. Dominant during moderate to low-intensity efforts sustained beyond 2 minutes: jogging, cycling, longer swimming. Fat oxidation increases as intensity drops and duration extends.

The systems are not switches — they overlap continuously. A 10-second sprint still uses the oxidative system (just to a small degree). What changes is the proportion. Training specific systems increases the capacity and efficiency of each pathway.`,
            keyPoints: [
              'PCr system (0–10s): maximal efforts; replenishes in 3–5 min.',
              'Glycolytic system (10s–2min): moderate-to-high intensity; produces lactate.',
              'Aerobic system (2min+): burns fat and carbs with oxygen; dominant at sustained moderate effort.',
              'All three systems operate simultaneously — intensity determines which predominates.',
            ],
            references: [
              {
                title: 'Exercise Physiology: Nutrition, Energy, and Human Performance',
                authors: 'McArdle WD, Katch FI, Katch VL',
                journal: 'Lippincott Williams & Wilkins',
                year: 2015,
                url: 'https://www.ncbi.nlm.nih.gov/nlmcatalog/101241016',
                type: 'guideline',
              },
            ],
          },
          {
            id: 'cc-hr-zones',
            title: 'Heart Rate Zones Explained',
            estimatedMinutes: 5,
            content: `Heart rate zones are a practical framework for quantifying training intensity. They roughly map to the energy systems being used and the physiological adaptations being targeted.

**Zone 1 (50–60% HRmax): Very light.** Recovery and movement. Fat oxidation is high. Minimal cardiovascular stress. Suitable for active recovery days.

**Zone 2 (60–70% HRmax): Aerobic base / fat burning.** The training zone most associated with mitochondrial biogenesis — growth of new mitochondria in muscle cells. Sustained Zone 2 work (20–90 min sessions) is the primary driver of aerobic capacity and fat-burning efficiency. Conversational pace — you can speak in full sentences. Elite endurance athletes spend ~80% of their volume here.

**Zone 3 (70–80% HRmax): Aerobic threshold.** The "moderate" intensity zone — harder than a comfortable pace but not a full effort. Cardiorespiratory stress increases. Less effective at producing aerobic adaptations per unit of fatigue than Zone 2 (hence why many coaches advise against spending too much time here).

**Zone 4 (80–90% HRmax): Lactate threshold.** Just above the point where lactate clearance can keep pace with production. Sustainable for 20–60 minutes. Interval sessions targeting VO2max often operate here.

**Zone 5 (90–100% HRmax): VO2max / maximal.** Short intervals (30s–4min). Dramatically improves maximal oxygen uptake. Very taxing — requires significant recovery. Use sparingly.

**Estimating max HR:** 220 − age is a rough population estimate. A more accurate method: 208 − (0.7 × age) (Tanaka formula).`,
            keyPoints: [
              'Zone 2 (60–70% HRmax) drives mitochondrial growth and fat-burning efficiency.',
              'Elite endurance athletes spend ~80% of volume in Zone 2.',
              'Zone 3 ("moderate") produces high fatigue relative to aerobic adaptation — often a zone to avoid lingering in.',
              'Zones 4–5 target VO2max and lactate threshold — high benefit but high recovery cost.',
            ],
            references: [
              {
                title: 'Age-predicted maximal heart rate revisited',
                authors: 'Tanaka H, Monahan KD, Seals DR',
                journal: 'Journal of the American College of Cardiology',
                year: 2001,
                url: 'https://pubmed.ncbi.nlm.nih.gov/11153730/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'energy-systems-quiz',
          questions: [
            {
              id: 'esq-1',
              question: 'Which energy system is the primary fuel source for a 10-second maximal sprint?',
              options: [
                'Aerobic (oxidative) system',
                'Glycolytic system',
                'Phosphocreatine (PCr) system',
                'All three systems contribute equally',
              ],
              correctIndex: 2,
              explanation: 'The PCr (phosphocreatine) system regenerates ATP without oxygen at the fastest rate — making it dominant for maximal efforts lasting under 10 seconds such as sprints, jumps, and Olympic lifts. It fully replenishes within 3–5 minutes of rest.',
            },
            {
              id: 'esq-2',
              question: 'Zone 2 training (60–70% HRmax) is particularly valuable because it:',
              options: [
                'Maximises calorie burn per unit of time versus other zones',
                'Primarily drives mitochondrial biogenesis and fat oxidation efficiency',
                'Develops maximal oxygen uptake (VO2max) faster than any other zone',
                'Is the only zone that uses fat as a fuel source',
              ],
              correctIndex: 1,
              explanation: 'Zone 2 is the primary driver of mitochondrial biogenesis — the growth of new mitochondria in muscle cells. More mitochondria increases aerobic capacity and the rate of fat oxidation. Elite endurance athletes spend approximately 80% of training volume in Zone 2 for this reason.',
            },
            {
              id: 'esq-3',
              question: 'After a maximal sprint, how long does the PCr system require to fully replenish its energy stores?',
              options: [
                '30–60 seconds',
                '1–2 minutes',
                '3–5 minutes',
                '10–15 minutes',
              ],
              correctIndex: 2,
              explanation: 'Phosphocreatine stores fully replenish within approximately 3–5 minutes of rest after a maximal sprint. This is why Olympic lifting and sprint training programs prescribe 3–5 minute rest periods between sets — shorter rests mean incomplete PCr recovery and reduced performance on subsequent sets.',
            },
          ],
        },
      },

      // ── Module 2: Programming Cardio ───────────────────────────────────────
      {
        id: 'cardio-programming',
        title: 'Programming Cardio with Strength Training',
        lessons: [
          {
            id: 'cc-zone2',
            title: 'Zone 2 Training: The Aerobic Base',
            estimatedMinutes: 5,
            content: `Zone 2 training has undergone a renaissance in both elite sport and general fitness communities — and the science supports the enthusiasm.

**Mitochondrial adaptations.** Zone 2 work is the most potent stimulus for mitochondrial biogenesis (the synthesis of new mitochondria). Mitochondria are the cellular organelles that perform aerobic energy production. More mitochondria means greater aerobic capacity, faster fat oxidation, and improved lactate clearance — benefits that translate to both endurance and strength training recovery.

**Practical implementation.** Zone 2 is a conversational pace. A rough test: you should be able to speak in complete sentences (unlike Zone 3 where you can manage only a few words). For most people, this corresponds to light jogging, cycling, or rowing at 60–70% of max HR, or using the Maffetone Method: 180 − age as a rough upper HR limit.

**Duration and frequency.** Research suggests meaningful adaptations accumulate at around 150–180 minutes of Zone 2 per week. This can be split into 3–4 sessions of 40–60 minutes. For strength-focused athletes, even 2 × 30-minute Zone 2 sessions per week produces measurable aerobic improvement.

**Interference effect.** Concern exists that concurrent aerobic and strength training attenuates hypertrophy gains. Research by Wilson et al. (2012) found this effect is real but modest when cardio is kept to Zone 2 intensity and sessions are separated from strength training by several hours (or scheduled on different days). High-intensity cardio (HIIT) produces a larger interference effect.`,
            keyPoints: [
              'Zone 2 drives mitochondrial biogenesis — the primary adaptation for aerobic capacity.',
              'Target 150–180 minutes per week of Zone 2 for meaningful aerobic adaptation.',
              'Conversational pace (full sentences) is the practical Zone 2 test.',
              'Concurrent training interference is minimised with low-intensity cardio and session separation.',
            ],
            references: [
              {
                title: 'Concurrent Training: A Meta-Analysis Examining Interference of Aerobic and Resistance Exercises',
                authors: 'Wilson JM, Marin PJ, Rhea MR, et al.',
                journal: 'Journal of Strength and Conditioning Research',
                year: 2012,
                url: 'https://pubmed.ncbi.nlm.nih.gov/22002517/',
                type: 'meta-analysis',
              },
            ],
          },
          {
            id: 'cc-hiit',
            title: 'HIIT and High-Intensity Conditioning',
            estimatedMinutes: 5,
            content: `High-Intensity Interval Training (HIIT) alternates short bursts of near-maximal effort with periods of rest or light activity. It is time-efficient and produces significant cardiovascular and metabolic adaptations — but it comes with a higher recovery cost.

**How HIIT works.** By repeatedly pushing into Zone 4–5, HIIT drives adaptations at the upper end of the aerobic system: increased VO2max (maximal oxygen uptake), improved stroke volume, enhanced lactate threshold. The "EPOC" effect (excess post-exercise oxygen consumption) also means calorie expenditure stays elevated for hours after a session.

**Common HIIT formats:**
- **Tabata (Izumi Tabata, 1996):** 20 seconds at ~170% VO2max, 10 seconds rest, × 8 rounds (4 minutes). Produces VO2max improvements comparable to much longer aerobic sessions.
- **30/90 intervals:** 30 seconds hard (Zone 5), 90 seconds easy (Zone 1–2), repeated 6–10 times.
- **4×4 intervals:** 4 minutes at 85–95% HRmax, 3 minutes easy, × 4 rounds. The most studied HIIT protocol for VO2max.

**Programming considerations.** HIIT is taxing on the CNS and musculoskeletal system. For strength athletes, 1–2 HIIT sessions per week is typically sufficient, with sessions scheduled on non-lower-body strength days to minimise interference and injury risk. More is not better — exceeding 2 high-intensity sessions per week for strength-focused athletes increases injury risk and may impair recovery.`,
            keyPoints: [
              'HIIT improves VO2max, lactate threshold, and metabolic efficiency time-efficiently.',
              'The Tabata protocol (4 minutes total) produces VO2max gains comparable to much longer sessions.',
              '1–2 HIIT sessions per week is sufficient for strength athletes — more risks interference.',
              'Schedule HIIT away from leg-dominant strength sessions to minimise interference.',
            ],
            references: [
              {
                title: 'Effects of Moderate-Intensity Endurance and High-Intensity Intermittent Training on Anaerobic Capacity and VO2max',
                authors: 'Tabata I, Nishimura K, Kouzaki M, et al.',
                journal: 'Medicine & Science in Sports & Exercise',
                year: 1996,
                url: 'https://pubmed.ncbi.nlm.nih.gov/8897392/',
                type: 'journal',
              },
            ],
          },
        ],
        quiz: {
          id: 'cardio-prog-quiz',
          questions: [
            {
              id: 'cpq-1',
              question: 'For a strength-focused athlete, how many HIIT sessions per week is generally recommended?',
              options: [
                '0 — HIIT always impairs strength gains',
                '1–2 sessions, scheduled away from heavy leg days',
                '3–4 sessions to maximise cardiovascular adaptations',
                '5+ sessions — more HIIT always produces more aerobic improvement',
              ],
              correctIndex: 1,
              explanation: '1–2 HIIT sessions per week is the evidence-based recommendation for strength athletes. This provides meaningful aerobic adaptation without excessive CNS and musculoskeletal stress. Scheduling HIIT away from heavy leg days minimises the interference effect on lower-body hypertrophy and recovery.',
            },
            {
              id: 'cpq-2',
              question: 'What does the "interference effect" in concurrent training refer to?',
              options: [
                'The way strength training impairs endurance performance',
                'How aerobic training can attenuate strength and hypertrophy gains',
                'The scheduling conflict between morning and evening training sessions',
                'The negative effect of fatigue on motivation',
              ],
              correctIndex: 1,
              explanation: 'The interference effect describes how concurrent aerobic training can attenuate (reduce) strength and hypertrophy adaptations. It is most pronounced with high-intensity cardio, large cardio volumes, and sessions immediately before strength work. It is minimised with Zone 2 cardio, lower volumes, and session separation.',
            },
            {
              id: 'cpq-3',
              type: 'true-false',
              question: 'The original Tabata protocol consists of just 4 minutes of total work (8 rounds of 20 seconds on, 10 seconds off).',
              options: ['True', 'False'],
              correctIndex: 0,
              explanation: 'True. The original Tabata protocol by Dr. Izumi Tabata (1996) is 8 rounds of 20 seconds at ~170% VO2max followed by 10 seconds of rest — totalling 4 minutes. The study found it produced VO2max improvements comparable to much longer moderate-intensity training sessions, making it one of the most studied time-efficient interval protocols.',
            },
          ],
        },
      },
    ],
  },

  // ── Nutrition (4) ──────────────────────────────────────────────────────────
  {
    id: 'protein-mastery',
    title: 'Protein for Athletes',
    description: 'Protein synthesis, leucine threshold, timing, and practical targets for muscle retention and growth.',
    category: 'nutrition',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    relatedGoals: ['hypertrophy'],
    tags: ['protein', 'leucine', 'mps', 'muscle building'],
    coverEmoji: '🥩',
    modules: [],
  },
  {
    id: 'cutting-bulking',
    title: 'Cutting & Bulking',
    description: 'Evidence-based strategies for caloric deficit phases and caloric surplus phases.',
    category: 'nutrition',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    relatedGoals: ['fat-loss', 'hypertrophy'],
    tags: ['deficit', 'surplus', 'body composition', 'recomp'],
    coverEmoji: '⚖️',
    modules: [],
  },
  {
    id: 'peri-workout-nutrition',
    title: 'Pre & Post Workout Nutrition',
    description: 'What to eat around training sessions to maximise energy, recovery, and muscle protein synthesis.',
    category: 'nutrition',
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    relatedGoals: ['hypertrophy', 'general-fitness'],
    tags: ['pre-workout', 'post-workout', 'carbs', 'creatine'],
    coverEmoji: '🍌',
    modules: [],
  },
  {
    id: 'micronutrients-athletes',
    title: 'Micronutrients for Athletes',
    description: 'Vitamins, minerals, and electrolytes that matter most for training performance and recovery.',
    category: 'nutrition',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    relatedGoals: ['general-fitness'],
    tags: ['vitamins', 'electrolytes', 'iron', 'vitamin D'],
    coverEmoji: '🥦',
    modules: [],
  },

  // ── Science (4) ────────────────────────────────────────────────────────────
  {
    id: 'muscle-hypertrophy-science',
    title: 'Mechanisms of Muscle Growth',
    description: 'The cellular biology of hypertrophy: mechanical tension, metabolic stress, and muscle damage.',
    category: 'strength-training',
    difficulty: 'advanced',
    estimatedMinutes: 50,
    relatedGoals: ['hypertrophy'],
    tags: ['hypertrophy', 'mTOR', 'satellite cells', 'myofibrillar'],
    coverEmoji: '🔬',
    modules: [],
  },
  {
    id: 'hormones-performance',
    title: 'Hormones & Performance',
    description: 'Testosterone, growth hormone, cortisol, and insulin — how they respond to training and nutrition.',
    category: 'strength-training',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    relatedGoals: ['hypertrophy', 'general-fitness'],
    tags: ['testosterone', 'cortisol', 'hormones', 'endocrine'],
    coverEmoji: '⚗️',
    modules: [],
  },
  {
    id: 'periodization-science',
    title: 'Periodization Theory',
    description: 'Linear, undulating, block, and conjugate periodization models — when and how to use each.',
    category: 'strength-training',
    difficulty: 'advanced',
    estimatedMinutes: 55,
    relatedGoals: ['hypertrophy'],
    tags: ['periodization', 'programming', 'block', 'DUP'],
    coverEmoji: '📊',
    modules: [],
  },
  {
    id: 'nervous-system-training',
    title: 'Neuromuscular Adaptations',
    description: 'How the nervous system adapts to training, motor unit recruitment, and neural efficiency gains.',
    category: 'strength-training',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    relatedGoals: ['hypertrophy'],
    tags: ['neuromuscular', 'motor units', 'RFD', 'neural adaptations'],
    coverEmoji: '⚡',
    modules: [],
  },

  // ── Technique (4) ──────────────────────────────────────────────────────────
  {
    id: 'squat-mastery',
    title: 'Squat Mastery',
    description: 'Bar path, depth, stance, and cuing for high-bar, low-bar, and front squat variations.',
    category: 'strength-training',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    relatedGoals: ['hypertrophy'],
    tags: ['squat', 'technique', 'form', 'depth'],
    coverEmoji: '🏋️',
    modules: [],
  },
  {
    id: 'deadlift-mastery',
    title: 'Deadlift Mastery',
    description: 'Conventional, sumo, and Romanian deadlift technique, setup, and bracing cues.',
    category: 'strength-training',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    relatedGoals: ['hypertrophy'],
    tags: ['deadlift', 'hinge', 'technique', 'bracing'],
    coverEmoji: '🏗️',
    modules: [],
  },
  {
    id: 'bench-press-mastery',
    title: 'Bench Press Mastery',
    description: 'Grip width, arch, leg drive, and scapular retraction for a safe and strong bench press.',
    category: 'strength-training',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    relatedGoals: ['hypertrophy'],
    tags: ['bench press', 'chest', 'technique', 'shoulder safety'],
    coverEmoji: '🛋️',
    modules: [],
  },
  {
    id: 'overhead-press-mastery',
    title: 'Overhead Press Mastery',
    description: 'Strict press and push press technique — shoulder health, wrist position, and core bracing.',
    category: 'strength-training',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    relatedGoals: ['hypertrophy'],
    tags: ['overhead press', 'shoulders', 'technique', 'push'],
    coverEmoji: '🙌',
    modules: [],
  },

  // ── Mind (3) ───────────────────────────────────────────────────────────────
  {
    id: 'training-psychology',
    title: 'Training Psychology',
    description: 'Motivation theory, habit formation, mental rehearsal, and dealing with training plateaus.',
    category: 'metabolic-health',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    relatedGoals: ['general-fitness'],
    tags: ['motivation', 'habits', 'mindset', 'consistency'],
    coverEmoji: '🧠',
    modules: [],
  },
  {
    id: 'goal-setting-performance',
    title: 'Goal Setting & Performance',
    description: 'SMART goals, outcome vs process goals, and how to structure a meaningful training life.',
    category: 'metabolic-health',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    relatedGoals: ['general-fitness'],
    tags: ['goals', 'planning', 'accountability', 'mindset'],
    coverEmoji: '🎯',
    modules: [],
  },
  {
    id: 'stress-adaptation',
    title: 'Stress, Lifestyle & Adaptation',
    description: 'How chronic life stress, sleep debt, and allostatic load affect training adaptation.',
    category: 'metabolic-health',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    relatedGoals: ['general-fitness'],
    tags: ['stress', 'allostatic load', 'sleep debt', 'adaptation'],
    coverEmoji: '🌊',
    modules: [],
  },
];

export const courses: Course[] = [...detailedCourses, ...courseScaffolds];

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getModuleById(courseId: string, moduleId: string) {
  return getCourseById(courseId)?.modules.find((m) => m.id === moduleId);
}

export function getAllLessonIds(courseId: string): string[] {
  return getCourseById(courseId)?.modules.flatMap((m) =>
    m.lessons.map((l) => l.id),
  ) ?? [];
}
