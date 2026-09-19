// What the page compares, in one place.
//
// The API and the front end MUST agree on which direction is better, or the
// winner highlight lands on the wrong team — which is worse than no highlight
// at all, because it looks authoritative. So the direction lives here, is
// served inside the API response, and the page never decides for itself.
//
//   better: 'high'  more is better (yards, points scored, takeaways)
//   better: 'low'   less is better (interceptions thrown, sacks allowed,
//                   points conceded, penalty yards)
//   count: true     a SEASON TOTAL, not a rate
//   format: 'clock' seconds, to be shown as mm:ss
//
// `count` matters more than it looks. Early in a season one club has played
// once and another twice, so 174 tackles against 68 is mostly a fact about how
// many games each has played. Those rows are labelled on the page, and the
// column headings carry each team's games played, so the denominator is never
// hidden.
//
// Two traps in ESPN's naming, both already paid for once:
//
//  - `passing.sacks` is sacks the OFFENCE TOOK. `defensive.sacks` is sacks the
//    DEFENCE MADE. Same word, opposite meaning, opposite direction.
//  - `passingYards` is gross; `netPassingYards` is after sack yardage. Mixing
//    them makes a team's passing game look better than it was.

const m = (key, label, cat, stat, better, opts = {}) => ({ key, label, cat, stat, better, ...opts });

export const CATEGORIES = [
  {
    key: 'scoring',
    title: 'Scoring & drives',
    note: 'Points, and how efficiently each club turns possession into them.',
    open: true,
    metrics: [
      // Points conceded comes off the RECORD, not the defensive category:
      // ESPN serves defensive.pointsAllowed and yardsAllowed as 0 all season,
      // and a real 0 is indistinguishable from missing data on a page.
      { key: 'ppg', label: 'Points per game', cat: 'scoring', stat: 'totalPointsPerGame', better: 'high' },
      { key: 'papg', label: 'Points allowed per game', from: 'record', field: 'pointsAgainstPerGame', better: 'low', dp: 1 },
      { key: 'diff', label: 'Point differential', from: 'record', field: 'differential', better: 'high', dp: 0, count: true },
      m('totalTd', 'Touchdowns', 'scoring', 'totalTouchdowns', 'high', { count: true }),
      m('thirdPct', 'Third down %', 'miscellaneous', 'thirdDownConvPct', 'high', { suffix: '%' }),
      m('fourthPct', 'Fourth down %', 'miscellaneous', 'fourthDownConvPct', 'high', { suffix: '%' }),
      m('rzScore', 'Red zone scoring %', 'miscellaneous', 'redzoneScoringPct', 'high', { suffix: '%' }),
      m('rzTd', 'Red zone touchdown %', 'miscellaneous', 'redzoneTouchdownPct', 'high', { suffix: '%' }),
      m('fdPerGame', 'First downs per game', 'miscellaneous', 'firstDownsPerGame', 'high'),
      m('fdPass', 'First downs passing', 'miscellaneous', 'firstDownsPassing', 'high', { count: true }),
      m('fdRush', 'First downs rushing', 'miscellaneous', 'firstDownsRushing', 'high', { count: true }),
      m('top', 'Time of possession', 'miscellaneous', 'possessionTimeSeconds', 'high', { count: true, format: 'clock' }),
    ],
  },
  {
    key: 'passing',
    title: 'Passing',
    note: 'Net figures are after sack yardage; gross is before it.',
    open: true,
    metrics: [
      m('passYpg', 'Passing yards per game (net)', 'passing', 'netPassingYardsPerGame', 'high'),
      m('passYds', 'Passing yards (net)', 'passing', 'netPassingYards', 'high', { count: true }),
      m('passGross', 'Passing yards (gross)', 'passing', 'passingYards', 'high', { count: true }),
      m('comp', 'Completions', 'passing', 'completions', 'high', { count: true }),
      m('att', 'Attempts', 'passing', 'passingAttempts', 'high', { count: true }),
      m('compPct', 'Completion %', 'passing', 'completionPct', 'high', { suffix: '%' }),
      m('ypa', 'Yards per attempt (net)', 'passing', 'netYardsPerPassAttempt', 'high'),
      m('ypc', 'Yards per completion', 'passing', 'yardsPerCompletion', 'high'),
      m('passTd', 'Passing touchdowns', 'passing', 'passingTouchdowns', 'high', { count: true }),
      m('passTdPct', 'Touchdown %', 'passing', 'passingTouchdownPct', 'high', { suffix: '%' }),
      m('ints', 'Interceptions thrown', 'passing', 'interceptions', 'low', { count: true }),
      m('intPct', 'Interception %', 'passing', 'interceptionPct', 'low', { suffix: '%' }),
      m('rating', 'Team passer rating', 'passing', 'QBRating', 'high'),
      m('longPass', 'Longest pass', 'passing', 'longPassing', 'high'),
      m('passFd', 'Passing first downs', 'passing', 'passingFirstDowns', 'high', { count: true }),
      m('passBig', 'Passing plays of 20+', 'passing', 'passingBigPlays', 'high', { count: true }),
      m('yac', 'Yards after catch', 'passing', 'passingYardsAfterCatch', 'high', { count: true }),
      m('sacksTaken', 'Sacks allowed', 'passing', 'sacks', 'low', { count: true }),
      m('sackYds', 'Yards lost to sacks', 'passing', 'sackYardsLost', 'low', { count: true }),
    ],
  },
  {
    key: 'rushing',
    title: 'Rushing',
    metrics: [
      m('rushYpg', 'Rushing yards per game', 'rushing', 'rushingYardsPerGame', 'high'),
      m('rushYds', 'Rushing yards', 'rushing', 'rushingYards', 'high', { count: true }),
      m('carries', 'Carries', 'rushing', 'rushingAttempts', 'high', { count: true }),
      m('ypr', 'Yards per carry', 'rushing', 'yardsPerRushAttempt', 'high'),
      m('rushTd', 'Rushing touchdowns', 'rushing', 'rushingTouchdowns', 'high', { count: true }),
      m('longRush', 'Longest rush', 'rushing', 'longRushing', 'high'),
      m('rushFd', 'Rushing first downs', 'rushing', 'rushingFirstDowns', 'high', { count: true }),
      m('rushBig', 'Rushing plays of 10+', 'rushing', 'rushingBigPlays', 'high', { count: true }),
      m('stuffed', 'Runs stopped for a loss', 'rushing', 'stuffs', 'low', { count: true }),
      m('rushFum', 'Rushing fumbles', 'rushing', 'rushingFumbles', 'low', { count: true }),
    ],
  },
  {
    key: 'receiving',
    title: 'Receiving',
    metrics: [
      m('recYpg', 'Receiving yards per game', 'receiving', 'receivingYardsPerGame', 'high'),
      m('rec', 'Receptions', 'receiving', 'receptions', 'high', { count: true }),
      m('targets', 'Targets', 'receiving', 'receivingTargets', 'high', { count: true }),
      m('ypRec', 'Yards per reception', 'receiving', 'yardsPerReception', 'high'),
      m('recTd', 'Receiving touchdowns', 'receiving', 'receivingTouchdowns', 'high', { count: true }),
      m('longRec', 'Longest reception', 'receiving', 'longReception', 'high'),
      m('recFd', 'Receiving first downs', 'receiving', 'receivingFirstDowns', 'high', { count: true }),
      m('recBig', 'Receptions of 20+', 'receiving', 'receivingBigPlays', 'high', { count: true }),
      m('recYac', 'Yards after catch', 'receiving', 'receivingYardsAfterCatch', 'high', { count: true }),
    ],
  },
  {
    key: 'defence',
    title: 'Defence',
    note: 'Points allowed comes from the season record — ESPN does not publish a per-team yards-allowed figure.',
    metrics: [
      { key: 'papg2', label: 'Points allowed per game', from: 'record', field: 'pointsAgainstPerGame', better: 'low', dp: 1 },
      m('sacksMade', 'Sacks', 'defensive', 'sacks', 'high', { count: true }),
      m('sackYdsMade', 'Sack yards', 'defensive', 'sackYards', 'high', { count: true }),
      m('hurries', 'Quarterback hurries', 'defensive', 'hurries', 'high', { count: true }),
      m('tfl', 'Tackles for loss', 'defensive', 'tacklesForLoss', 'high', { count: true }),
      m('picks', 'Interceptions', 'defensiveInterceptions', 'interceptions', 'high', { count: true }),
      m('pickYds', 'Interception return yards', 'defensiveInterceptions', 'interceptionYards', 'high', { count: true }),
      m('pickTd', 'Interception touchdowns', 'defensiveInterceptions', 'interceptionTouchdowns', 'high', { count: true }),
      m('pd', 'Passes defended', 'defensive', 'passesDefended', 'high', { count: true }),
      m('batted', 'Passes batted down', 'defensive', 'passesBattedDown', 'high', { count: true }),
      m('ff', 'Fumbles forced', 'general', 'fumblesForced', 'high', { count: true }),
      m('fumRec', 'Fumbles recovered', 'general', 'fumblesRecovered', 'high', { count: true }),
      m('defTd', 'Defensive touchdowns', 'defensive', 'defensiveTouchdowns', 'high', { count: true }),
      m('safeties', 'Safeties', 'defensive', 'safeties', 'high', { count: true }),
      m('solo', 'Solo tackles', 'defensive', 'soloTackles', 'high', { count: true }),
      m('assist', 'Assisted tackles', 'defensive', 'assistTackles', 'high', { count: true }),
      m('tackles', 'Total tackles', 'defensive', 'totalTackles', 'high', { count: true }),
    ],
  },
  {
    key: 'turnovers',
    title: 'Turnovers & discipline',
    note: 'The one table where every row that is "high" is something the other side did.',
    metrics: [
      m('toDiff', 'Turnover differential', 'miscellaneous', 'turnOverDifferential', 'high', { count: true }),
      m('takeaways', 'Takeaways', 'miscellaneous', 'totalTakeaways', 'high', { count: true }),
      m('giveaways', 'Giveaways', 'miscellaneous', 'totalGiveaways', 'low', { count: true }),
      m('fumbles', 'Fumbles', 'general', 'fumbles', 'low', { count: true }),
      m('fumblesLost', 'Fumbles lost', 'general', 'fumblesLost', 'low', { count: true }),
      m('penalties', 'Penalties', 'general', 'totalPenalties', 'low', { count: true }),
      m('penaltyYds', 'Penalty yards', 'general', 'totalPenaltyYards', 'low', { count: true }),
      m('fdPenalty', 'First downs given by penalty', 'miscellaneous', 'firstDownsPenalty', 'low', { count: true }),
    ],
  },
  {
    key: 'special',
    title: 'Kicking, punting & returns',
    metrics: [
      m('fgPct', 'Field goal %', 'kicking', 'fieldGoalPct', 'high', { suffix: '%' }),
      m('fgMade', 'Field goals made', 'kicking', 'fieldGoalsMade', 'high', { count: true }),
      m('fgLong', 'Longest field goal', 'kicking', 'longFieldGoalMade', 'high' ),
      m('xpPct', 'Extra point %', 'kicking', 'extraPointPct', 'high', { suffix: '%' }),
      m('kickPts', 'Points from kicking', 'kicking', 'totalKickingPoints', 'high', { count: true }),
      m('tbPct', 'Touchback %', 'kicking', 'touchbackPct', 'high', { suffix: '%' }),
      m('puntAvg', 'Punting average (gross)', 'punting', 'grossAvgPuntYards', 'high'),
      m('puntNet', 'Punting average (net)', 'punting', 'netAvgPuntYards', 'high'),
      m('puntIn20', 'Punts inside the 20', 'punting', 'puntsInside20', 'high', { count: true }),
      m('puntLong', 'Longest punt', 'punting', 'longPunt', 'high'),
      m('krAvg', 'Yards per kick return', 'returning', 'yardsPerKickReturn', 'high'),
      m('prAvg', 'Yards per punt return', 'returning', 'yardsPerPuntReturn', 'high'),
      m('krTd', 'Kick return touchdowns', 'returning', 'kickReturnTouchdowns', 'high', { count: true }),
      m('prTd', 'Punt return touchdowns', 'returning', 'puntReturnTouchdowns', 'high', { count: true }),
    ],
  },
];

/** The quarterback table is built separately — it reads a player, not a team. */
export const QB = [
  m('qbYards', 'Passing yards', 'passing', 'passingYards', 'high', { count: true }),
  m('qbYpg', 'Yards per game', 'passing', 'yardsPerGame', 'high'),
  m('qbComp', 'Completions', 'passing', 'completions', 'high', { count: true }),
  m('qbAtt', 'Attempts', 'passing', 'passingAttempts', 'high', { count: true }),
  m('qbCompPct', 'Completion %', 'passing', 'completionPct', 'high', { suffix: '%' }),
  m('qbTd', 'Touchdowns', 'passing', 'passingTouchdowns', 'high', { count: true }),
  m('qbInt', 'Interceptions', 'passing', 'interceptions', 'low', { count: true }),
  m('qbRating', 'Passer rating', 'passing', 'QBRating', 'high'),
  m('qbYpa', 'Yards per attempt', 'passing', 'yardsPerPassAttempt', 'high'),
  m('qbYpc', 'Yards per completion', 'passing', 'yardsPerCompletion', 'high'),
  m('qbLong', 'Longest pass', 'passing', 'longPassing', 'high'),
  m('qbSacks', 'Sacks taken', 'passing', 'sacks', 'low', { count: true }),
  m('qbRush', 'Rushing yards', 'rushing', 'rushingYards', 'high', { count: true }),
  m('qbRushTd', 'Rushing touchdowns', 'rushing', 'rushingTouchdowns', 'high', { count: true }),
];

/** Every team metric, flat — used by the tests and by nothing else. */
export const ALL_TEAM_METRICS = CATEGORIES.flatMap((c) => c.metrics);

/**
 * Which of the supplied values wins a row.
 *
 * Returns every key that ties for the lead, because a two-way tie highlighted
 * as a single winner is a wrong answer. Values that are null (a stat ESPN did
 * not serve) never win and never block a winner.
 */
export function leaders(values, better) {
  const real = Object.entries(values).filter(([, v]) => typeof v === 'number' && Number.isFinite(v));
  // A leader needs something to lead. One value against two blanks is not a
  // comparison, so nothing is highlighted.
  if (real.length < 2) return [];
  const best = better === 'low'
    ? Math.min(...real.map(([, v]) => v))
    : Math.max(...real.map(([, v]) => v));
  const won = real.filter(([, v]) => v === best).map(([k]) => k);
  // If everybody is level there is no leader. Highlighting all three on a
  // 0-0-0 row says "all three lead", which is not a fact about anything.
  return won.length === real.length ? [] : won;
}

/** Seconds to mm:ss. ESPN serves time of possession as a raw second count. */
export function clock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}
