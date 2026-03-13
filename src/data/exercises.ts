import type { Exercise } from '../types';

export const exercises: Exercise[] = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Lie flat on a bench with your eyes under the bar.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unrack and lower the bar to your mid-chest, keeping elbows at ~75°.',
      'Press explosively back to the start, locking out at the top.',
    ],
    tips: ['Keep your shoulder blades retracted and depressed throughout.', 'Drive your feet into the floor for leg drive.'],
    pattern: 'push-horizontal',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['dumbbell'],
    instructions: [
      'Sit on a flat bench with dumbbells resting on your thighs.',
      'Lie back, pressing the dumbbells to full extension above your chest.',
      'Lower with control, elbows at ~75°, until you feel a stretch in your chest.',
      'Press back up to full extension.',
    ],
    tips: ['Greater range of motion than barbell press.', 'Keep your wrists neutral, not bent.'],
    pattern: 'push-horizontal',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['dumbbell'],
    instructions: [
      'Set bench to 30–45° incline.',
      'Hold dumbbells at shoulder level, palms forward.',
      'Press up and slightly inward until arms are extended.',
      'Lower with control to the start.',
    ],
    tips: ['Targets the upper chest. Avoid going above 45° or it becomes mainly a shoulder exercise.'],
    pattern: 'push-horizontal',
  },
  {
    id: 'cable-chest-fly',
    name: 'Cable Chest Fly',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    equipment: ['cable'],
    instructions: [
      'Set cables at chest height on both sides.',
      'Stand in the center, one foot forward for balance.',
      'With a slight elbow bend, bring both handles together in front of your chest.',
      'Slowly return to the start, feeling a stretch across your chest.',
    ],
    tips: ['Constant tension throughout the movement. Squeeze hard at the peak contraction.'],
    pattern: 'push-horizontal',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in a high plank, hands shoulder-width apart.',
      'Lower your chest to the floor, keeping your body rigid.',
      'Push back up to the start.',
    ],
    tips: ['Keep your core tight and hips in line with your shoulders throughout.'],
    pattern: 'push-horizontal',
  },

  // ── BACK ───────────────────────────────────────────────────────────────────
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Hinge at the hips until your torso is roughly parallel to the floor.',
      'Grip the bar just outside shoulder-width.',
      'Pull the bar to your lower chest/upper abdomen, driving your elbows back.',
      'Lower with control to the start.',
    ],
    tips: ['Keep your lower back neutral. Do not round.', 'Lead with your elbows, not your hands.'],
    pattern: 'pull-horizontal',
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['dumbbell'],
    instructions: [
      'Place one knee and hand on a bench for support.',
      'Hold a dumbbell in the opposite hand, arm hanging down.',
      'Pull the dumbbell up to your hip, driving your elbow toward the ceiling.',
      'Lower slowly to the start.',
    ],
    tips: ['Think "elbow to the sky", not "hand to hip".'],
    pattern: 'pull-horizontal',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['cable', 'machine'],
    instructions: [
      'Sit at a lat pulldown machine, pad securing your thighs.',
      'Grip the bar wider than shoulder-width.',
      'Pull the bar down to your upper chest, driving your elbows down and back.',
      'Control the bar back up to full arm extension.',
    ],
    tips: ['Lean back slightly at the bottom. Avoid excessive swinging.'],
    pattern: 'pull-vertical',
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'core'],
    equipment: ['bodyweight'],
    instructions: [
      'Hang from a bar with an overhand grip, slightly wider than shoulder-width.',
      'Pull your chest toward the bar, driving your elbows down and back.',
      'Pause at the top, then lower with control.',
    ],
    tips: ['Avoid kipping (swinging). Slow negatives build strength fast.'],
    pattern: 'pull-vertical',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: ['cable'],
    instructions: [
      'Sit at a cable row station, feet on the platform, knees slightly bent.',
      'Grip the handle and sit tall with a neutral spine.',
      'Pull the handle to your lower abdomen, driving your elbows back.',
      'Reach forward to full extension with control.',
    ],
    tips: ['Do not round your back at the start. Stay upright throughout.'],
    pattern: 'pull-horizontal',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
    equipment: ['cable'],
    instructions: [
      'Set a cable to head height with a rope attachment.',
      'Grip the rope with both hands, pull toward your face, separating the ends.',
      'External rotate at the top so your forearms are vertical.',
      'Return slowly to the start.',
    ],
    tips: ['Essential for shoulder health. Use light weight and high reps.'],
    pattern: 'pull-horizontal',
  },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Stand with a barbell at shoulder height, gripping just outside shoulder-width.',
      'Press the bar straight up overhead until arms are locked out.',
      'Lower with control to the starting position.',
    ],
    tips: ['Squeeze your glutes to protect your lower back. Keep your core braced.'],
    pattern: 'push-vertical',
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    instructions: [
      'Stand holding dumbbells at your sides.',
      'Raise both arms out to the sides until parallel to the floor.',
      'Pause briefly at the top, then lower slowly.',
    ],
    tips: ['Lead with your elbows, not your hands. Use lighter weight than you think.'],
    pattern: 'isolation',
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: ['dumbbell'],
    instructions: [
      'Sit or stand holding dumbbells at shoulder height, palms forward.',
      'Press up until arms are fully extended.',
      'Lower back to shoulder height with control.',
    ],
    tips: ['Slightly angle the dumbbells inward at the top for a natural arc.'],
    pattern: 'push-vertical',
  },

  // ── ARMS ───────────────────────────────────────────────────────────────────
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    instructions: [
      'Stand holding a barbell with an underhand grip, hands shoulder-width.',
      'Curl the bar up toward your shoulders, keeping your elbows pinned to your sides.',
      'Squeeze your biceps at the top, then lower slowly.',
    ],
    tips: ['Avoid swinging your torso. Control the negative.'],
    pattern: 'isolation',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: ['dumbbell'],
    instructions: [
      'Stand with dumbbells at your sides, palms facing in (neutral grip).',
      'Curl both dumbbells up toward your shoulders simultaneously.',
      'Lower with control.',
    ],
    tips: ['Hits the brachialis and brachioradialis as well as the biceps.'],
    pattern: 'isolation',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    category: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['cable'],
    instructions: [
      'Stand at a high cable with a bar or rope attachment.',
      'Grip attachment with elbows bent at your sides.',
      'Push down until your arms are fully extended.',
      'Slowly return to the start.',
    ],
    tips: ['Keep your elbows tucked and stationary throughout the movement.'],
    pattern: 'isolation',
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher',
    category: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    instructions: [
      'Lie on a bench holding a barbell above your chest with straight arms.',
      'Lower the bar toward your forehead by bending only at the elbows.',
      'Extend back to the top without moving your upper arms.',
    ],
    tips: ['Keep your upper arms vertical. Go slow on the way down.'],
    pattern: 'isolation',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    category: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: ['dumbbell', 'cable'],
    instructions: [
      'Hold one dumbbell with both hands above your head, arms fully extended.',
      'Lower the dumbbell behind your head by bending your elbows.',
      'Extend back to the top.',
    ],
    tips: ['Full overhead position maximally stretches the long head of the tricep.'],
    pattern: 'isolation',
  },

  // ── QUADS / LEGS ───────────────────────────────────────────────────────────
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Set the barbell on your upper traps, grip just outside shoulder-width.',
      'Unrack and step back, feet shoulder-width apart, toes slightly out.',
      'Squat down until your thighs are at least parallel to the floor.',
      'Drive up through your heels back to standing.',
    ],
    tips: ['Keep your chest up and knees tracking over your toes.', 'Brace your core before descending.'],
    pattern: 'squat',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'kettlebell'],
    instructions: [
      'Hold a dumbbell or kettlebell vertically at your chest.',
      'Stand with feet slightly wider than shoulder-width, toes out.',
      'Squat down between your knees until your thighs are parallel.',
      'Drive back up to standing.',
    ],
    tips: ['Great for beginners to learn squat mechanics. Keep your chest tall throughout.'],
    pattern: 'squat',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: ['machine'],
    instructions: [
      'Sit in the leg press machine, feet shoulder-width on the platform.',
      'Release the safety and lower the platform until knees reach 90°.',
      'Press back up to full extension without locking out hard.',
    ],
    tips: ['Higher foot placement emphasizes glutes/hamstrings; lower placement emphasizes quads.'],
    pattern: 'squat',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    equipment: ['machine'],
    instructions: [
      'Sit in the machine with your shins behind the pad.',
      'Extend your legs to full extension, squeezing your quads hard at the top.',
      'Lower with control.',
    ],
    tips: ['Isolation exercise. Use as a finisher after compound movements.'],
    pattern: 'isolation',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: ['bodyweight', 'dumbbell'],
    instructions: [
      'Stand tall with dumbbells at your sides (optional).',
      'Step forward with one leg and lower your back knee toward the floor.',
      'Drive off your front foot to step through into the next lunge.',
    ],
    tips: ['Keep your front knee over your ankle, not your toes.'],
    pattern: 'squat',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: ['dumbbell', 'barbell', 'bodyweight'],
    instructions: [
      'Stand a few feet in front of a bench, rest your rear foot on the bench.',
      'Lower your back knee toward the floor until your front thigh is parallel.',
      'Drive back up through your front heel.',
    ],
    tips: ['One of the best single-leg exercises. Expect quad soreness!'],
    pattern: 'squat',
  },

  // ── HAMSTRINGS / GLUTES ────────────────────────────────────────────────────
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'back'],
    equipment: ['barbell', 'dumbbell'],
    instructions: [
      'Stand holding a barbell at hip level, feet shoulder-width apart.',
      'Hinge at the hips, pushing them back as you lower the bar down your legs.',
      'Lower until you feel a strong hamstring stretch (just below the knee for most).',
      'Drive your hips forward to return to standing.',
    ],
    tips: ['Keep the bar in contact with your legs throughout. Maintain a neutral spine.'],
    pattern: 'hinge',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['hamstrings', 'glutes', 'quads', 'core'],
    equipment: ['barbell'],
    instructions: [
      'Stand with feet hip-width, bar over mid-foot.',
      'Hinge down, grip just outside your legs.',
      'Brace your core, chest up, and pull the bar up along your legs.',
      'Lock out at the top by squeezing your glutes.',
    ],
    tips: ['Think "push the floor away" not "pull the bar up". Keep your lats engaged.'],
    pattern: 'hinge',
  },
  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    category: 'strength',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: ['barbell'],
    instructions: [
      'Sit on the floor with your upper back against a bench, barbell over your hips.',
      'Plant your feet flat, shoulder-width apart.',
      'Drive your hips up until your body forms a straight line from knees to shoulders.',
      'Squeeze your glutes hard at the top, then lower.',
    ],
    tips: ['The best glute isolation exercise. Use a barbell pad for comfort.'],
    pattern: 'hinge',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'strength',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: ['bodyweight', 'dumbbell'],
    instructions: [
      'Lie on your back with knees bent, feet flat on the floor.',
      'Drive your hips up by squeezing your glutes.',
      'Pause at the top, then lower.',
    ],
    tips: ['Beginner-friendly version of hip thrust. Can add a dumbbell on hips for resistance.'],
    pattern: 'hinge',
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl (Machine)',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    equipment: ['machine'],
    instructions: [
      'Lie face-down on the leg curl machine, pad resting on your lower legs.',
      'Curl your heels toward your glutes.',
      'Pause at peak contraction, then lower slowly.',
    ],
    tips: ['Plantar flex your feet (toes pointed) to maximize hamstring activation.'],
    pattern: 'isolation',
  },

  // ── CALVES & CORE ──────────────────────────────────────────────────────────
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'strength',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: ['machine', 'bodyweight', 'dumbbell'],
    instructions: [
      'Stand with the balls of your feet on an elevated surface (or flat floor).',
      'Rise up onto your toes as high as possible.',
      'Pause at the top, then lower fully for a calf stretch at the bottom.',
    ],
    tips: ['Full range of motion is key — go all the way up and all the way down.'],
    pattern: 'isolation',
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Get into a push-up position but rest on your forearms.',
      'Keep your body in a straight line from head to heels.',
      'Hold for the target duration, breathing steadily.',
    ],
    tips: ['Do not let your hips sag or rise. Think "long body".'],
    pattern: 'isolation',
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    instructions: [
      'Hang from a pull-up bar with an overhand grip.',
      'Keeping legs straight (or knees bent for easier), raise your legs to hip height or above.',
      'Lower slowly, do not swing.',
    ],
    tips: ['Posterior pelvic tilt at the top for full ab activation.'],
    pattern: 'isolation',
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    category: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'back'],
    equipment: ['bodyweight'],
    instructions: [
      'Kneel on the floor holding an ab wheel with both hands.',
      'Roll forward until your body is nearly parallel to the floor.',
      'Pull back using your core (not arms) to return to start.',
    ],
    tips: ['One of the most demanding core exercises. Start with small range of motion.'],
    pattern: 'isolation',
  },

  // ── CARDIO ─────────────────────────────────────────────────────────────────
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    category: 'cardio',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'core', 'shoulders'],
    equipment: ['kettlebell'],
    instructions: [
      'Stand with feet shoulder-width apart, kettlebell on the floor in front.',
      'Hinge at the hips, grip the kettlebell, and hike it back between your legs.',
      'Drive your hips forward explosively, swinging the kettlebell to shoulder height.',
      'Let it swing back and repeat.',
    ],
    tips: ['It is a hip hinge, not a squat. Power comes from your hips, not your arms.'],
    pattern: 'hinge',
  },
  {
    id: 'box-jump',
    name: 'Box Jump',
    category: 'cardio',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'calves'],
    equipment: ['bodyweight'],
    instructions: [
      'Stand in front of a sturdy box or platform.',
      'Swing your arms and bend your knees, then jump onto the box.',
      'Land softly with both feet flat, knees slightly bent.',
      'Step down carefully and reset.',
    ],
    tips: ['Start with a lower box and build up. Step down, do not jump down.'],
    pattern: 'squat',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'cardio',
    primaryMuscles: ['core'],
    secondaryMuscles: ['quads', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Start in a high plank position.',
      'Drive one knee toward your chest, then switch legs in a running motion.',
      'Keep your hips level and core tight throughout.',
    ],
    tips: ['Speed it up for a cardio challenge; slow it down for core work.'],
    pattern: 'cardio',
  },

  // ── NEW EXERCISES ───────────────────────────────────────────────────────────
  {
    id: 'dips',
    name: 'Dips',
    category: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: [
      'Grip parallel bars and lock your arms out at the top, body straight.',
      'Lower yourself by bending your elbows, leaning slightly forward to emphasise the chest.',
      'Descend until your upper arms are at least parallel to the floor.',
      'Press back up to full elbow extension.',
    ],
    tips: [
      'Lean forward more to shift emphasis to the chest; stay more upright to hit triceps.',
      'Keep elbows tracking back, not flaring wide, to protect the shoulder joint.',
      'Add weight with a dip belt once bodyweight becomes too easy.',
    ],
    pattern: 'push-horizontal',
  },
  {
    id: 'incline-barbell-press',
    name: 'Incline Barbell Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Set the bench to 30–45° incline. Lie back with eyes under the bar.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unrack and lower the bar to your upper chest with controlled tempo.',
      'Press explosively back to full extension.',
    ],
    tips: [
      'A 30° angle targets the upper chest best; beyond 45° shifts too much load onto the shoulders.',
      'Keep your shoulder blades pinched together throughout the set.',
      'Control the eccentric (lowering) for maximum upper chest development.',
    ],
    pattern: 'push-horizontal',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
    equipment: ['dumbbell'],
    instructions: [
      'Hinge at the hips until your torso is nearly parallel to the floor.',
      'Hold dumbbells hanging below your chest, palms facing each other.',
      'With a slight bend in the elbows, raise the dumbbells out to the sides.',
      'Squeeze your rear delts and upper back at the top, then lower with control.',
    ],
    tips: [
      'Use light weight — this is an isolation movement, not a strength exercise.',
      'Think about leading with your elbows and pinkies, not your hands.',
      'Avoid shrugging your traps; keep your neck long throughout.',
      'Critical for shoulder health and posture — include it every upper-body session.',
    ],
    pattern: 'pull-horizontal',
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: ['dumbbell'],
    instructions: [
      'Sit with dumbbells at shoulder height, palms facing you (as if finishing a curl).',
      'As you press up, rotate your palms away from you.',
      'Finish with palms facing forward at the top, arms fully extended.',
      'Reverse the motion to return to the start.',
    ],
    tips: [
      'The rotation recruits all three heads of the deltoid across a larger arc of motion than a standard press.',
      'Move smoothly through the rotation — do not jerk or rush.',
      'Slightly lighter weight than standard dumbbell shoulder press is normal.',
    ],
    pattern: 'push-vertical',
  },
  {
    id: 'step-up',
    name: 'Step-Up',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: ['dumbbell'],
    instructions: [
      'Stand in front of a bench or box holding dumbbells at your sides.',
      'Step one foot onto the box and drive through that heel to stand up fully.',
      'Bring the trailing foot up to stand on the box, then step back down with control.',
      'Complete all reps on one side before switching.',
    ],
    tips: [
      'Drive through the heel of the working leg — do not push off the trailing foot.',
      'Box height should allow your working knee to be at roughly 90° at the bottom.',
      'This is a highly knee-friendly single-leg exercise excellent for building strength imbalances.',
      'Pause at the top for 1 second to maximise glute activation.',
    ],
    pattern: 'squat',
  },
  {
    id: 'nordic-hamstring-curl',
    name: 'Nordic Hamstring Curl',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'core'],
    equipment: ['bodyweight'],
    instructions: [
      'Kneel on a mat with your ankles secured under a barbell, heavy dumbbell, or by a partner.',
      'With your body straight from knee to head, slowly lower yourself toward the floor.',
      'Resist the descent using your hamstrings for as long as possible.',
      'Place hands down to catch yourself, then use your hands to push back to the start.',
    ],
    tips: [
      'This is one of the most effective exercises for hamstring strength and injury prevention.',
      'Start with just 3-5 reps — it is extremely demanding and causes significant delayed-onset soreness.',
      'Progress by slowing the descent (aim for 5 seconds down) and reducing hand assistance over time.',
      'Keep hips extended throughout — avoid piking at the hips.',
    ],
    pattern: 'hinge',
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    category: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    equipment: ['cable'],
    instructions: [
      'Attach a rope to a high cable pulley. Kneel facing the machine.',
      'Hold the rope ends beside your ears, elbows pointing forward.',
      'Crunch your rib cage down toward your pelvis, rounding your spine.',
      'Squeeze your abs hard at the bottom, then return with control.',
    ],
    tips: [
      'Unlike sit-ups, you can progressively load this movement — add weight each week.',
      'The movement is a spinal flexion, not a hip flexion — do not bow forward at the hips.',
      'Keep constant tension on the cable throughout — do not let the stack rest at the top.',
      'A slow 3-second descent (eccentric) doubles the time under tension.',
    ],
    pattern: 'isolation',
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Load one end of a barbell and wedge the other end into a corner or landmine attachment.',
      'Stand over the bar, hinge until your torso is 45° to the floor.',
      'Grip the bar (use a V-handle or hands together) and row toward your lower chest.',
      'Squeeze your lats at the top, then lower with control.',
    ],
    tips: [
      'T-bar rows develop thickness in the mid-back that horizontal cable rows cannot replicate.',
      'Keep your lower back neutral and brace your core throughout — do not round under load.',
      'Drive your elbows back, not up, to maximise lat engagement over trap involvement.',
      'A controlled 2-second negative builds more muscle than letting the weight drop.',
    ],
    pattern: 'pull-horizontal',
  },

  // ── PHASE 2 EXERCISES ────────────────────────────────────────────────────────
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    category: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: ['barbell'],
    instructions: [
      'Lie on a flat bench. Grip the bar with hands roughly shoulder-width apart (narrower than a standard bench grip).',
      'Unrack and lower the bar to your lower chest, keeping elbows tucked close to your sides.',
      'Press explosively back to full extension, squeezing your triceps at the top.',
    ],
    tips: [
      'Hands too close (less than 6 inches apart) strains the wrists — shoulder-width is optimal.',
      'Tuck the elbows at 45° to the torso, not perpendicular, to protect the shoulder joint.',
      'This is the king of tricep mass builders — prioritise progressive overload here.',
    ],
    pattern: 'push-horizontal',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    category: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['barbell', 'dumbbell', 'cable'],
    instructions: [
      'Sit at a preacher bench. Rest the backs of your upper arms flat against the pad.',
      'Hold the bar or dumbbells with an underhand grip, arms extended.',
      'Curl the weight up by flexing your elbows, keeping upper arms pinned against the pad.',
      'Lower with control until your arms are nearly fully extended.',
    ],
    tips: [
      'The pad eliminates any body English — every rep is honest work.',
      'Stop just short of full extension at the bottom to keep tension on the bicep tendon.',
      'The stretched position (near the bottom) is where hypertrophy stimulus is greatest.',
      'Use a slightly wider than shoulder-width grip on the EZ bar to reduce wrist strain.',
    ],
    pattern: 'isolation',
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: ['dumbbell'],
    instructions: [
      'Set a bench to a 45–60° incline. Sit back with a dumbbell in each hand, arms hanging straight down.',
      'Curl both dumbbells simultaneously, keeping your elbows stationary behind your torso.',
      'Squeeze hard at the top, then lower with a slow 3-second eccentric.',
    ],
    tips: [
      'The incline angle places the long head of the bicep in a deep stretch — its most productive position.',
      'Do not let your elbows drift forward; keep them behind the plane of your torso the entire time.',
      'This is one of the most effective exercises for developing bicep peak.',
      'Use lighter weight than standing curls — the stretched position dramatically increases the challenge.',
    ],
    pattern: 'isolation',
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings', 'calves'],
    equipment: ['machine'],
    instructions: [
      'Position yourself in the hack squat machine with your back flat against the pad and feet shoulder-width on the platform.',
      'Release the safety handles and lower yourself until your knees reach 90° or deeper.',
      'Drive through your full foot to press back to the start, without fully locking out the knees.',
    ],
    tips: [
      'Placing feet higher on the platform increases glute/hamstring involvement; lower placement emphasises quads.',
      'The machine tracks the path for you — focus entirely on depth and quad contraction.',
      'An excellent option when lower back fatigue limits barbell squatting.',
      'Try pausing 1 second in the hole for a brutal quad pump.',
    ],
    pattern: 'squat',
  },
  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Dumbbell Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['dumbbell'],
    instructions: [
      'Set a bench to a low incline (20–30°). Lie face-down with your chest against the pad, dumbbells hanging below.',
      'Row both dumbbells up by driving your elbows back and squeezing your shoulder blades together.',
      'Lower with control to a full hang before the next rep.',
    ],
    tips: [
      'The chest support eliminates all lower back stress — ideal for high-fatigue training days.',
      'This allows you to isolate the upper back without any compensatory hip extension or trunk rotation.',
      'Lead with your elbows, not your hands, to maximise lat and rhomboid engagement.',
      'Use a neutral (palms-in) grip to target the mid-back; underhand grip shifts more load to the biceps.',
    ],
    pattern: 'pull-horizontal',
  },
  {
    id: 'single-leg-romanian-deadlift',
    name: 'Single-Leg Romanian Deadlift',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'barbell'],
    instructions: [
      'Stand on one foot, holding a dumbbell in the opposite hand (or both hands for a barbell).',
      'Hinge at the hip, extending the free leg behind you as a counterbalance, and lower the weight toward the floor.',
      'Keep your back flat and hips square throughout the movement.',
      'Return to standing by driving through the heel of the working leg.',
    ],
    tips: [
      'Focus on the hip hinge — the foot goes back because the hip hinges, not the other way around.',
      'Keep your pelvis level; avoid rotating your hips open toward the ceiling.',
      'Start light — balance demands and unilateral hamstring loading are both significant.',
      'Excellent for identifying and correcting strength asymmetries between legs.',
    ],
    pattern: 'hinge',
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    equipment: ['dumbbell'],
    instructions: [
      'Lie on a flat bench with a dumbbell in each hand, arms extended above your chest, palms facing each other.',
      'With a slight, fixed bend in the elbows, lower the dumbbells out to the sides in a wide arc.',
      'Stop when you feel a deep stretch in the chest, then squeeze the pecs to return to the start.',
    ],
    tips: [
      'This is a stretch-focused isolation movement — use light-to-moderate weight and prioritise the range of motion.',
      'Keep the elbow angle constant (do not curl the weights up). Think of hugging a barrel.',
      'The dumbbell fly targets the chest through a different range than pressing — it belongs in every hypertrophy program.',
      'A 2-second pause in the stretched position dramatically increases time under tension.',
    ],
    pattern: 'isolation',
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    category: 'strength',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'back'],
    equipment: ['cable', 'resistance band'],
    instructions: [
      'Attach a handle to a cable at chest height. Stand sideways to the cable, feet shoulder-width, holding the handle at your chest.',
      'Brace your core hard, then press the handle straight out in front of you to full arm extension.',
      'Hold for 1–2 seconds, then return the handle to your chest. Do not rotate.',
    ],
    tips: [
      'The Pallof press trains anti-rotation — resisting twisting forces — which is how your core works in real life.',
      'The further you stand from the machine, the harder the anti-rotation demand.',
      'Avoid letting your hips or shoulders turn toward the cable. Zero rotation is the goal.',
      'This exercise is highly transferable to sport performance and injury prevention.',
    ],
    pattern: 'isolation',
  },
  {
    id: 'hyperextension',
    name: 'Hyperextension (Back Extension)',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: ['machine', 'bodyweight'],
    instructions: [
      'Position yourself face-down in a hyperextension bench, feet secured, hips at the pad edge.',
      'Cross your arms over your chest or hold a weight plate. Lower your torso toward the floor.',
      'Contract your glutes and lower back to raise your torso back to neutral (do not hyperextend beyond horizontal).',
    ],
    tips: [
      'Stop at horizontal — excessive extension loads the lumbar spine unnecessarily.',
      'To bias the glutes, round your back slightly and think "squeeze glutes" on the way up.',
      'To bias the erectors, keep the spine neutral throughout the range.',
      'Add a plate or dumbbell to the chest for progressive overload once bodyweight becomes easy.',
    ],
    pattern: 'hinge',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['core', 'upper back', 'glutes'],
    equipment: ['barbell'],
    instructions: [
      'Rest the barbell across the front of your shoulders (front rack or crossed-arm position). Keep elbows high.',
      'Stand with feet shoulder-width, toes turned slightly out.',
      'Squat by breaking at the hips and knees simultaneously, keeping your torso as upright as possible.',
      'Drive through your full foot to return to the start.',
    ],
    tips: [
      'The front-loaded position forces an upright torso — this maximises quad involvement and reduces lower back stress.',
      'Elbows must stay high throughout. If they drop, the bar will roll off your shoulders.',
      'Ankle mobility is critical; work on it with heel-elevated squats or mobility drills if you struggle to hit depth.',
      'Front squats transfer directly to athletic performance and Olympic lifting.',
    ],
    pattern: 'squat',
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

// ─── YouTube Demo IDs ─────────────────────────────────────────────────────────
// Curated technique tutorial videos from Jeff Nippard, Alan Thrall, Athlean-X
const EXERCISE_YOUTUBE_IDS: Record<string, string> = {
  'barbell-bench-press':       'vcBig73ojpE', // Jeff Nippard — bench press technique
  'dumbbell-bench-press':      'vthMCtgVtFw', // Athlean-X — bench press checklist
  'incline-dumbbell-press':    'LwHoNk-sjgs', // Jeff Nippard — push workout
  'cable-chest-fly':           'NsEbXsTwas8', // Jeff Nippard — chest exercises ranked
  'push-up':                   'AhdtowFDKT0', // Athlean-X — perfect push-up
  'barbell-row':               'axoeDmW0oAY', // Jeff Nippard — rowing technique
  'dumbbell-row':              'spKGN0XzErU', // Jeff Nippard — pull day
  'lat-pulldown':              'WQasM7Jh9dQ', // Athlean-X — lat exercises
  'pull-up':                   'Hdc7Mw6BIEE', // Jeff Nippard — pull-up for wide back
  'seated-cable-row':          'IOl42YpK_Es', // Athlean-X — pull workout
  'face-pull':                 'eIq5CB9JfKE', // Athlean-X — face pulls
  'overhead-press':            '_RlRDWO2jfg', // Jeff Nippard — overhead press
  'dumbbell-lateral-raise':    'v_ZkxWzYnMc', // Jeff Nippard — side delts
  'dumbbell-shoulder-press':   'SgyUoY0IZ7A', // Jeff Nippard — shoulder tier list
  'barbell-curl':              'i1YgFZB6alI', // Jeff Nippard — biceps
  'hammer-curl':               'spKGN0XzErU', // Jeff Nippard — pull day (includes hammer curls)
  'tricep-pushdown':           '8Nkfuhxsl-0', // Athlean-X — tricep workout
  'skull-crusher':             'popGXI-qs98', // Jeff Nippard — triceps
  'overhead-tricep-extension': 'G9uZ7fxgBjY', // Athlean-X — triceps
  'barbell-back-squat':        'bs_Ej32IYgo', // Alan Thrall — squat technique
  'goblet-squat':              'RjexvOAsVtI', // Athlean-X — perfect leg workout
  'leg-press':                 'H6mRkx1x77k', // Jeff Nippard — leg day
  'leg-extension':             'sDMAPXzvjAo', // Athlean-X — leg workout
  'walking-lunge':             'H6mRkx1x77k', // Jeff Nippard — leg day
  'bulgarian-split-squat':     'sDMAPXzvjAo', // Athlean-X — leg workout
  'romanian-deadlift':         '_oyxCn2iSjU', // Jeff Nippard — RDL technique
  'deadlift':                  'VL5Ab0T07e4', // Jeff Nippard — conventional deadlift
  'hip-thrust':                'xDmFkJxPzeM', // Jeff Nippard — hip thrust
  'glute-bridge':              '1jp2uhfO8M0', // Athlean-X — glute bridge
  'leg-curl':                  '0a_fVS2s4Ho', // Jeff Nippard — hamstring training
  'standing-calf-raise':       'RjexvOAsVtI', // Athlean-X — leg workout
  'plank':                     '1G0y8D5rFDc', // Jeff Nippard — core training
  'hanging-leg-raise':         'Pr1ieGZ5atk', // Athlean-X — hanging leg raise
  'ab-wheel-rollout':          'Xx_RyuA4DzU', // Athlean-X — ab wheel
  'kettlebell-swing':          '9LIAhxQHmak', // Caroline Girvan — kettlebell workout
  'box-jump':                  'JDnttfZ0c1s', // Athlean-X — bodyweight exercises
  'mountain-climbers':         'pIbAhBxwcxo', // Athlean-X — essential exercises
  'dips':                      'yN6Q1UI_xkE', // Jeff Nippard — dips
  'incline-barbell-press':     'jPLdzuHckI8', // Buff Dudes — incline barbell press
  'rear-delt-fly':             'qfc70k40318', // Jeff Nippard — rear delts
  'arnold-press':              'tZafawk3arc', // Athlean-X — shoulder exercises
  'step-up':                   'RjexvOAsVtI', // Athlean-X — leg workout
  'nordic-hamstring-curl':     '0a_fVS2s4Ho', // Jeff Nippard — hamstring training
  'cable-crunch':              '1G0y8D5rFDc', // Jeff Nippard — core training
  't-bar-row':                 'BPXjwGiKOmo', // Athlean-X — back workout
  // Phase 2 additions
  'close-grip-bench-press':    '8Nkfuhxsl-0', // Athlean-X — tricep workout
  'preacher-curl':             'i1YgFZB6alI', // Jeff Nippard — biceps
  'incline-dumbbell-curl':     'i1YgFZB6alI', // Jeff Nippard — biceps (long head)
  'hack-squat':                'H6mRkx1x77k', // Jeff Nippard — leg day
  'chest-supported-row':       'axoeDmW0oAY', // Jeff Nippard — rowing technique
  'single-leg-romanian-deadlift': '_oyxCn2iSjU', // Jeff Nippard — RDL
  'dumbbell-fly':              'NsEbXsTwas8', // Jeff Nippard — chest exercises
  'pallof-press':              '1G0y8D5rFDc', // Jeff Nippard — core training
  'hyperextension':            'VL5Ab0T07e4', // Jeff Nippard — posterior chain
  'front-squat':               'bs_Ej32IYgo', // Alan Thrall — squat technique
};

export function getExerciseYouTubeId(id: string): string | undefined {
  return EXERCISE_YOUTUBE_IDS[id];
}
