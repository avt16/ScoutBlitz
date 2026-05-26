// ───────────────────────────────────────────────────────────────────────────
// SwimBlitz Indian Swim Meet Database
// ───────────────────────────────────────────────────────────────────────────
//
// Coverage:
//   • All major Swimming Federation of India (SFI) recurring nationals
//   • Khelo India Youth Games & University Games (specific editions)
//   • National School Games (SGFI)
//   • State-level senior + age-group championships (one entry per state)
//   • Major recurring club / private tournaments
//   • International meets where Indian swimmers regularly compete
//
// What's NOT in here:
//   • Most inter-school meets — schools don't publish these centrally
//   • Most inter-club meets — same reason
//   • Most district-level meets
//
// These can be added as the platform admin discovers them; the match
// function uses fuzzy name matching (alias-aware) so a logged competition
// like "Pune District Open 2023" can be added in a single new row without
// breaking existing matches.
//
// Schema:
//   { name, aliases?, state?, city?, year?, level, course?, recurring? }
//
//   name      — Canonical full name
//   aliases   — Common variations users might type
//   state     — Hosting state (omitted for recurring multi-state events)
//   city      — Host city (omitted for state-level annuals that rotate)
//   year      — Specific edition year. Omit for recurring/template entries.
//   level     — 'international' | 'national' | 'state' | 'district' | 'club' | 'school'
//   course    — 'LCM' | 'SCM' | 'mixed' — usually LCM at national+ level
//   recurring — true for annual meets that match across years
//
// Adding a new meet later:
//   Just append a row. The match function picks it up automatically. If a
//   meet has many name variations, populate `aliases` with the most common.
// ───────────────────────────────────────────────────────────────────────────

export const SWIM_MEETS = [
  // ── International meets Indian swimmers compete at ──────────────────────
  { name: 'Olympic Games',                                aliases: ['Olympics', 'Summer Olympics', 'Tokyo Olympics', 'Paris Olympics'],     level: 'international', recurring: true,  course: 'LCM' },
  { name: 'Olympic Games Tokyo 2020',                     aliases: ['Tokyo 2020', 'Tokyo Olympics 2021'],                                    year: 2021, level: 'international', course: 'LCM' },
  { name: 'Olympic Games Paris 2024',                     aliases: ['Paris 2024', 'Paris Olympics'],                                         year: 2024, level: 'international', course: 'LCM' },
  { name: 'World Aquatics Championships',                 aliases: ['World Championships', 'FINA Worlds', 'WAC'],                            level: 'international', recurring: true, course: 'LCM' },
  { name: 'World Aquatics Championships Budapest',        aliases: ['Budapest 2022'],                                                        year: 2022, level: 'international', course: 'LCM' },
  { name: 'World Aquatics Championships Fukuoka',         aliases: ['Fukuoka 2023'],                                                         year: 2023, level: 'international', course: 'LCM' },
  { name: 'World Aquatics Championships Doha',            aliases: ['Doha 2024'],                                                            year: 2024, level: 'international', course: 'LCM' },
  { name: 'World Aquatics Championships Singapore',       aliases: ['Singapore 2025'],                                                       year: 2025, level: 'international', course: 'LCM' },
  { name: 'Commonwealth Games',                           aliases: ['CWG'],                                                                   level: 'international', recurring: true, course: 'LCM' },
  { name: 'Commonwealth Games Birmingham 2022',           aliases: ['Birmingham 2022', 'CWG Birmingham'],                                    year: 2022, level: 'international', course: 'LCM' },
  { name: 'Asian Games',                                  aliases: ['Asiad'],                                                                level: 'international', recurring: true, course: 'LCM' },
  { name: '18th Asian Games Jakarta-Palembang',           aliases: ['Asian Games 2018', 'Jakarta 2018'],                                     year: 2018, level: 'international', course: 'LCM' },
  { name: '19th Asian Games Hangzhou',                    aliases: ['Asian Games 2022', 'Asian Games 2023', 'Hangzhou 2022', 'Hangzhou Asian Games'], year: 2023, level: 'international', course: 'LCM' },
  { name: 'Asian Aquatic Championships',                  aliases: ['Asian Championships', 'AASF Championship'],                             level: 'international', recurring: true, course: 'LCM' },
  { name: 'Asian Age Group Championships',                aliases: ['AAGC', 'Asian Age Group'],                                              level: 'international', recurring: true, course: 'LCM' },
  { name: 'South Asian Games',                            aliases: ['SAG', 'SAF Games', 'South Asia Games'],                                 level: 'international', recurring: true, course: 'LCM' },
  { name: '13th South Asian Games Kathmandu',             aliases: ['South Asian Games 2019', 'Kathmandu 2019'],                             year: 2019, level: 'international', course: 'LCM' },
  { name: 'World Junior Aquatics Championships',          aliases: ['World Junior Championships', 'FINA World Juniors'],                     level: 'international', recurring: true, course: 'LCM' },
  { name: 'FINA World Cup',                               aliases: ['World Aquatics World Cup', 'World Cup Series'],                         level: 'international', recurring: true, course: 'mixed' },
  { name: 'Singapore National Age Group Championships',   aliases: ['Singapore Open', 'Singapore Nationals'],                                level: 'international', recurring: true, course: 'LCM' },
  { name: 'Sri Lanka Aquatic Sports Championships',       aliases: ['Sri Lanka Nationals'],                                                  level: 'international', recurring: true },
  { name: 'Thailand Age Group Swimming Championships',    aliases: ['Thailand Age Group'],                                                   level: 'international', recurring: true },
  { name: 'Australian Age Swimming Championships',        aliases: ['Australian Age Nationals'],                                             level: 'international', recurring: true, course: 'LCM' },
  { name: 'Asian School Games',                                                                                                              level: 'international', recurring: true },

  // ── National-level recurring SFI championships ──────────────────────────
  { name: 'Senior National Aquatic Championships',        aliases: ['Senior Nationals', 'National Senior Swimming', 'Senior National Swimming Championship', 'SFI Senior Nationals'], level: 'national', recurring: true, course: 'LCM' },
  { name: 'Junior National Aquatic Championships',        aliases: ['Junior Nationals', 'National Junior Swimming', 'SFI Junior Nationals'], level: 'national', recurring: true, course: 'LCM' },
  { name: 'Sub-Junior National Aquatic Championships',    aliases: ['Sub Junior Nationals', 'Sub-Junior Nationals', 'SFI Sub Junior Nationals'], level: 'national', recurring: true, course: 'LCM' },
  { name: 'National Games of India',                      aliases: ['National Games'],                                                       level: 'national', recurring: true },
  { name: '36th National Games',                          aliases: ['National Games 2022', 'Gujarat National Games'],                        state: 'Gujarat', year: 2022, level: 'national' },
  { name: '37th National Games',                          aliases: ['National Games 2023', 'Goa National Games'],                            state: 'Goa', year: 2023, level: 'national' },
  { name: '38th National Games',                          aliases: ['National Games 2025', 'Uttarakhand National Games'],                    state: 'Uttarakhand', year: 2025, level: 'national' },
  { name: 'Federation Cup Aquatic Championships',         aliases: ['Federation Cup Swimming', 'SFI Federation Cup'],                        level: 'national', recurring: true },
  { name: 'Senior National Inter-State Aquatic Championships', aliases: ['National Inter State Swimming', 'Inter-State Aquatics'],           level: 'national', recurring: true },

  // ── Khelo India events ──────────────────────────────────────────────────
  { name: 'Khelo India Youth Games',                      aliases: ['KIYG', 'Khelo India Games', 'Khelo India School Games'],                level: 'national', recurring: true },
  { name: 'Khelo India School Games 2018',                aliases: ['KISG 2018', 'KIYG Delhi 2018'],                                         state: 'Delhi', city: 'New Delhi', year: 2018, level: 'national' },
  { name: 'Khelo India Youth Games 2019',                 aliases: ['KIYG 2019', 'KIYG Pune'],                                               state: 'Maharashtra', city: 'Pune', year: 2019, level: 'national' },
  { name: 'Khelo India Youth Games 2020',                 aliases: ['KIYG 2020', 'KIYG Guwahati'],                                           state: 'Assam', city: 'Guwahati', year: 2020, level: 'national' },
  { name: 'Khelo India Youth Games 2021-22',              aliases: ['KIYG 2021', 'KIYG Panchkula', 'KIYG 2022 Haryana'],                     state: 'Haryana', city: 'Panchkula', year: 2022, level: 'national' },
  { name: 'Khelo India Youth Games 2022',                 aliases: ['KIYG Madhya Pradesh', 'KIYG Bhopal 2023'],                              state: 'Madhya Pradesh', city: 'Bhopal', year: 2023, level: 'national' },
  { name: 'Khelo India Youth Games 2023',                 aliases: ['KIYG Chennai', 'KIYG Tamil Nadu'],                                      state: 'Tamil Nadu', city: 'Chennai', year: 2024, level: 'national' },
  { name: 'Khelo India University Games',                 aliases: ['KIUG', 'University Games', 'Khelo India University'],                   level: 'national', recurring: true },
  { name: 'Khelo India University Games 2020',            aliases: ['KIUG Bhubaneswar', 'KIUG Odisha'],                                      state: 'Odisha', city: 'Bhubaneswar', year: 2020, level: 'national' },
  { name: 'Khelo India University Games 2021',            aliases: ['KIUG Bengaluru', 'KIUG Karnataka'],                                     state: 'Karnataka', city: 'Bengaluru', year: 2022, level: 'national' },
  { name: 'Khelo India University Games 2022',            aliases: ['KIUG Lucknow', 'KIUG Uttar Pradesh'],                                   state: 'Uttar Pradesh', city: 'Lucknow', year: 2023, level: 'national' },
  { name: 'Khelo India University Games 2023',            aliases: ['KIUG Guwahati', 'KIUG Assam'],                                          state: 'Assam', city: 'Guwahati', year: 2024, level: 'national' },
  { name: 'Khelo India Para Games',                       aliases: ['KIPG', 'Para Khelo India'],                                             level: 'national', recurring: true },
  { name: 'Khelo India Winter Games',                                                                                                         level: 'national', recurring: true },

  // ── School-level recurring nationals ────────────────────────────────────
  { name: 'School Games Federation of India National Swimming Championship', aliases: ['SGFI Nationals', 'National School Games', 'School Games Federation', 'SGFI Swimming'], level: 'school', recurring: true },
  { name: 'CBSE Cluster Swimming Championship',           aliases: ['CBSE Cluster Swimming', 'CBSE Swimming Nationals'],                     level: 'school', recurring: true },
  { name: 'CISCE Inter-School Aquatic Championship',      aliases: ['ICSE Aquatic Championships', 'CISCE Swimming'],                          level: 'school', recurring: true },
  { name: 'CBSE National Swimming Championship',          aliases: ['CBSE Nationals Swimming'],                                              level: 'school', recurring: true },
  { name: 'All India Inter-University Aquatic Championship', aliases: ['Inter University Swimming', 'AIU Aquatics', 'All India University Swimming'], level: 'national', recurring: true },

  // ── State-level annual senior championships (one per state/UT) ──────────
  // These are the canonical "state nationals" each state association holds.
  // Names vary year to year — aliases cover the common variants.
  { name: 'Andhra Pradesh State Senior Aquatic Championships',  aliases: ['Andhra State Swimming', 'AP State Aquatic'],            state: 'Andhra Pradesh', level: 'state', recurring: true },
  { name: 'Arunachal Pradesh State Aquatic Championships',                                                                          state: 'Arunachal Pradesh', level: 'state', recurring: true },
  { name: 'Assam State Aquatic Championships',                  aliases: ['Assam State Swimming'],                                  state: 'Assam', level: 'state', recurring: true },
  { name: 'Bihar State Aquatic Championships',                  aliases: ['Bihar State Swimming'],                                  state: 'Bihar', level: 'state', recurring: true },
  { name: 'Chhattisgarh State Aquatic Championships',                                                                                state: 'Chhattisgarh', level: 'state', recurring: true },
  { name: 'Goa State Aquatic Championships',                    aliases: ['Goa State Swimming'],                                    state: 'Goa', level: 'state', recurring: true },
  { name: 'Gujarat State Aquatic Championships',                aliases: ['Gujarat State Swimming Championship'],                   state: 'Gujarat', level: 'state', recurring: true },
  { name: 'Haryana State Aquatic Championships',                aliases: ['Haryana State Swimming'],                                state: 'Haryana', level: 'state', recurring: true },
  { name: 'Himachal Pradesh State Aquatic Championships',                                                                            state: 'Himachal Pradesh', level: 'state', recurring: true },
  { name: 'Jharkhand State Aquatic Championships',                                                                                   state: 'Jharkhand', level: 'state', recurring: true },
  { name: 'Karnataka State Aquatic Championships',              aliases: ['Karnataka State Swimming Championship', 'KSSF Swimming', 'Karnataka State Swimming Federation Championship'], state: 'Karnataka', level: 'state', recurring: true },
  { name: 'Kerala State Aquatic Championships',                 aliases: ['Kerala State Swimming'],                                 state: 'Kerala', level: 'state', recurring: true },
  { name: 'Madhya Pradesh State Aquatic Championships',         aliases: ['MP State Swimming'],                                     state: 'Madhya Pradesh', level: 'state', recurring: true },
  { name: 'Maharashtra State Aquatic Championships',            aliases: ['Maharashtra State Swimming Championship', 'MSAA Championship', 'Aquatic Federation of Maharashtra Championship'], state: 'Maharashtra', level: 'state', recurring: true },
  { name: 'Manipur State Aquatic Championships',                                                                                     state: 'Manipur', level: 'state', recurring: true },
  { name: 'Meghalaya State Aquatic Championships',                                                                                   state: 'Meghalaya', level: 'state', recurring: true },
  { name: 'Mizoram State Aquatic Championships',                                                                                     state: 'Mizoram', level: 'state', recurring: true },
  { name: 'Nagaland State Aquatic Championships',                                                                                    state: 'Nagaland', level: 'state', recurring: true },
  { name: 'Odisha State Aquatic Championships',                 aliases: ['Odisha State Swimming'],                                 state: 'Odisha', level: 'state', recurring: true },
  { name: 'Punjab State Aquatic Championships',                 aliases: ['Punjab State Swimming'],                                 state: 'Punjab', level: 'state', recurring: true },
  { name: 'Rajasthan State Aquatic Championships',              aliases: ['Rajasthan State Swimming'],                              state: 'Rajasthan', level: 'state', recurring: true },
  { name: 'Sikkim State Aquatic Championships',                                                                                      state: 'Sikkim', level: 'state', recurring: true },
  { name: 'Tamil Nadu State Aquatic Championships',             aliases: ['Tamil Nadu State Swimming', 'TN State Swimming', 'TNSA Championship'], state: 'Tamil Nadu', level: 'state', recurring: true },
  { name: 'Telangana State Aquatic Championships',              aliases: ['Telangana State Swimming'],                              state: 'Telangana', level: 'state', recurring: true },
  { name: 'Tripura State Aquatic Championships',                                                                                     state: 'Tripura', level: 'state', recurring: true },
  { name: 'Uttar Pradesh State Aquatic Championships',          aliases: ['UP State Swimming', 'UP State Aquatic Championship'],     state: 'Uttar Pradesh', level: 'state', recurring: true },
  { name: 'Uttarakhand State Aquatic Championships',                                                                                 state: 'Uttarakhand', level: 'state', recurring: true },
  { name: 'West Bengal State Aquatic Championships',            aliases: ['Bengal State Swimming', 'WB State Aquatic Championship', 'WBSA Championship'], state: 'West Bengal', level: 'state', recurring: true },
  { name: 'Delhi State Aquatic Championships',                  aliases: ['Delhi State Swimming Championship', 'DSA Championship', 'Delhi Swimming Association Championship'], state: 'Delhi', level: 'state', recurring: true },
  { name: 'Chandigarh State Aquatic Championships',                                                                                  state: 'Chandigarh', level: 'state', recurring: true },
  { name: 'Jammu & Kashmir State Aquatic Championships',        aliases: ['J&K State Swimming'],                                    state: 'Jammu & Kashmir', level: 'state', recurring: true },
  { name: 'Ladakh Aquatic Championships',                                                                                            state: 'Ladakh', level: 'state', recurring: true },
  { name: 'Puducherry State Aquatic Championships',                                                                                  state: 'Puducherry', level: 'state', recurring: true },
  { name: 'Andaman & Nicobar Aquatic Championships',                                                                                 level: 'state', recurring: true },
  { name: 'Dadra & Nagar Haveli Aquatic Championships',                                                                              level: 'state', recurring: true },
  { name: 'Lakshadweep Aquatic Championships',                                                                                       level: 'state', recurring: true },

  // ── State-level junior/sub-junior championships ─────────────────────────
  { name: 'Karnataka State Junior Aquatic Championships',       aliases: ['Karnataka Junior Swimming'],                             state: 'Karnataka', level: 'state', recurring: true },
  { name: 'Karnataka State Sub-Junior Aquatic Championships',                                                                       state: 'Karnataka', level: 'state', recurring: true },
  { name: 'Maharashtra State Junior Aquatic Championships',                                                                          state: 'Maharashtra', level: 'state', recurring: true },
  { name: 'Maharashtra State Sub-Junior Aquatic Championships',                                                                      state: 'Maharashtra', level: 'state', recurring: true },
  { name: 'Tamil Nadu State Junior Aquatic Championships',                                                                           state: 'Tamil Nadu', level: 'state', recurring: true },
  { name: 'West Bengal State Junior Aquatic Championships',                                                                          state: 'West Bengal', level: 'state', recurring: true },
  { name: 'Delhi State Junior Aquatic Championships',           aliases: ['DSA Junior Championship'],                                state: 'Delhi', level: 'state', recurring: true },
  { name: 'Andhra Pradesh State Junior Aquatic Championships',                                                                       state: 'Andhra Pradesh', level: 'state', recurring: true },
  { name: 'Telangana State Junior Aquatic Championships',                                                                            state: 'Telangana', level: 'state', recurring: true },
  { name: 'Kerala State Junior Aquatic Championships',                                                                               state: 'Kerala', level: 'state', recurring: true },
  { name: 'Gujarat State Junior Aquatic Championships',                                                                              state: 'Gujarat', level: 'state', recurring: true },

  // ── Major district/zonal championships ──────────────────────────────────
  { name: 'Mumbai District Aquatic Championship',               aliases: ['MDSA Championship', 'Mumbai District Swimming', 'Mumbai District Swimming Association Championship'], state: 'Maharashtra', city: 'Mumbai', level: 'district', recurring: true },
  { name: 'Pune District Aquatic Championship',                 aliases: ['Pune District Swimming', 'PDSA Championship'],            state: 'Maharashtra', city: 'Pune', level: 'district', recurring: true },
  { name: 'Bengaluru District Aquatic Championship',            aliases: ['Bangalore Aquatic Association', 'BAA Championship'],     state: 'Karnataka', city: 'Bengaluru', level: 'district', recurring: true },
  { name: 'Chennai District Aquatic Championship',              aliases: ['Chennai District Swimming'],                              state: 'Tamil Nadu', city: 'Chennai', level: 'district', recurring: true },
  { name: 'Hyderabad District Aquatic Championship',                                                                                 state: 'Telangana', city: 'Hyderabad', level: 'district', recurring: true },
  { name: 'Kolkata District Aquatic Championship',                                                                                   state: 'West Bengal', city: 'Kolkata', level: 'district', recurring: true },
  { name: 'Ahmedabad District Aquatic Championship',                                                                                 state: 'Gujarat', city: 'Ahmedabad', level: 'district', recurring: true },
  { name: 'Surat District Aquatic Championship',                                                                                     state: 'Gujarat', city: 'Surat', level: 'district', recurring: true },
  { name: 'Jaipur District Aquatic Championship',                                                                                    state: 'Rajasthan', city: 'Jaipur', level: 'district', recurring: true },

  // ── Major private / club / sponsored meets ──────────────────────────────
  { name: 'Glenmark India Swimming Tour',                       aliases: ['Glenmark Swimming', 'Glenmark Aquatic Championship', 'Glenmark Junior Open'], level: 'club', recurring: true },
  { name: 'Milo Sub-Junior Swimming Meet',                      aliases: ['Milo Swimming Meet'],                                    level: 'club', recurring: true },
  { name: 'Asian School Aquatic Meet',                                                                                              level: 'school', recurring: true },
  { name: 'IIM Bangalore Swimming Championship',                aliases: ['IIM-B Aquatics'],                                        state: 'Karnataka', city: 'Bengaluru', level: 'club', recurring: true },
  { name: 'JSW Swimming Championship',                          aliases: ['JSW Inspire Institute Swimming'],                         state: 'Karnataka', level: 'club', recurring: true },
  { name: 'Talent Swimming Pool Aquatic Meet',                  aliases: ['TSP Meet', 'Talent Aquatic Meet'],                       state: 'Karnataka', city: 'Bengaluru', level: 'club', recurring: true },
  { name: 'Dolphin Aquatic Club Championship',                                                                                       level: 'club', recurring: true },
  { name: 'Otters Club Swimming Championship',                  aliases: ['Otters Club Mumbai'],                                    state: 'Maharashtra', city: 'Mumbai', level: 'club', recurring: true },
  { name: 'Khar Gymkhana Swimming Meet',                                                                                             state: 'Maharashtra', city: 'Mumbai', level: 'club', recurring: true },
  { name: 'Bombay Swimming Association Meet',                   aliases: ['BSA Swimming Meet'],                                     state: 'Maharashtra', city: 'Mumbai', level: 'club', recurring: true },
  { name: 'PYC Hindu Gymkhana Swimming Championship',                                                                                state: 'Maharashtra', city: 'Pune', level: 'club', recurring: true },
  { name: 'Khelo Hub Aquatic Meet',                                                                                                  level: 'club', recurring: true },
  { name: 'Smriti Swimming Tournament',                                                                                              level: 'club', recurring: true },
  { name: 'Reliance Foundation Swimming Championship',          aliases: ['Reliance Aquatic Meet'],                                 level: 'club', recurring: true },
  { name: 'Bridgestone India Swimming Tournament',                                                                                   level: 'club', recurring: true },
  { name: 'Anglian Medal Hunt Swimming Meet',                                                                                        level: 'club', recurring: true },

  // ── Specific known recent editions of major nationals ───────────────────
  { name: '73rd Senior National Aquatic Championships',         aliases: ['Senior Nationals 2019', 'Senior Nationals Bhopal'],     state: 'Madhya Pradesh', city: 'Bhopal', year: 2019, level: 'national', course: 'LCM' },
  { name: '74th Senior National Aquatic Championships',         aliases: ['Senior Nationals 2021'],                                 year: 2021, level: 'national', course: 'LCM' },
  { name: '75th Senior National Aquatic Championships',         aliases: ['Senior Nationals 2022'],                                 state: 'Assam', city: 'Guwahati', year: 2022, level: 'national', course: 'LCM' },
  { name: '76th Senior National Aquatic Championships',         aliases: ['Senior Nationals 2023'],                                 state: 'Karnataka', city: 'Bengaluru', year: 2023, level: 'national', course: 'LCM' },
  { name: '77th Senior National Aquatic Championships',         aliases: ['Senior Nationals 2024'],                                 state: 'Karnataka', city: 'Mangalore', year: 2024, level: 'national', course: 'LCM' },
  { name: '47th Junior National Aquatic Championships',         aliases: ['Junior Nationals 2020'],                                 year: 2020, level: 'national', course: 'LCM' },
  { name: '48th Junior National Aquatic Championships',         aliases: ['Junior Nationals 2022'],                                 year: 2022, level: 'national', course: 'LCM' },
  { name: '49th Junior National Aquatic Championships',         aliases: ['Junior Nationals 2023'],                                 state: 'Haryana', year: 2023, level: 'national', course: 'LCM' },
  { name: '50th Junior National Aquatic Championships',         aliases: ['Junior Nationals 2024'],                                 year: 2024, level: 'national', course: 'LCM' },

  // ── Other widely-attended meets ─────────────────────────────────────────
  { name: 'India International Junior Open Aquatic Championship', aliases: ['India International Junior Open'],                     level: 'international', recurring: true },
  { name: 'India Open Master Swimming Championship',            aliases: ['Masters Nationals'],                                     level: 'national', recurring: true },
  { name: 'All India Police Aquatic Championship',              aliases: ['Police Nationals Swimming'],                             level: 'national', recurring: true },
  { name: 'All India Railway Aquatic Championship',             aliases: ['Railway Nationals Swimming'],                            level: 'national', recurring: true },
  { name: 'All India Inter-Services Aquatic Championship',      aliases: ['Inter Services Swimming', 'Services Swimming Nationals'], level: 'national', recurring: true },
  { name: 'Indian Open Aquatic Championship',                                                                                        level: 'national', recurring: true },
  { name: 'AIPSA National Aquatic Championship',                aliases: ['Para Swimming Nationals'],                               level: 'national', recurring: true },
];

// ───────────────────────────────────────────────────────────────────────────
// Match function
// ───────────────────────────────────────────────────────────────────────────
//
// Why fuzzy:
//   Users type "Senior Nationals 2024" but the canonical name is "77th
//   Senior National Aquatic Championships". A strict equality check would
//   miss every real-world entry. We normalise both sides, drop years and
//   edition numbers, then compare token overlap.
//
// Returns:
//   { match: <meet>, score: 0..1 } on success
//   null when nothing crosses the threshold
// ───────────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set(['the', 'of', 'and', 'for', 'at', 'in', 'an', 'a']);

const normalise = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')                    // strip punctuation
    .replace(/\b\d{4}\b/g, '')                    // strip years (2023 etc)
    .replace(/\b\d+(st|nd|rd|th)\b/g, '')         // strip edition numbers (78th, 1st)
    .replace(/\b(amp)\b/g, '')                    // strip leftover html entities
    .replace(/\s+/g, ' ')
    .trim();

// Crude one-rule stemmer — strips trailing 's' from tokens longer than 3
// chars. Keeps "nationals" matching "national", "championships" matching
// "championship", etc. Not a real linguistic stemmer, but enough for
// English meet-name vocabulary and orders of magnitude cheaper than one.
const stem = (t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);

const tokenize = (s) =>
  normalise(s)
    .split(' ')
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
    .map(stem);

const overlapScore = (queryTokens, meetTokens) => {
  if (queryTokens.length === 0 || meetTokens.length === 0) return 0;
  const meetSet = new Set(meetTokens);
  let hits = 0;
  for (const t of queryTokens) if (meetSet.has(t)) hits++;
  return hits / Math.min(queryTokens.length, meetTokens.length);
};

/**
 * Returns the best-matching meet for a user-entered name (and optional date).
 * Scoring rule: best score across (canonical name + aliases). Threshold 0.6
 * gives us a sweet spot — "Senior Nationals" (2 tokens) matches "Senior
 * National Aquatic Championships" (4 tokens) at 2/2=1.0, while a totally
 * unrelated string ("Joe's Pool Party") scores ~0.
 *
 * @param {string} queryName      What the athlete typed
 * @param {string} [queryDate]    ISO date "YYYY-MM-DD" — used as a year hint
 * @returns {{ match: object, score: number, matchedOn: string } | null}
 */
export const findMeetMatch = (queryName, queryDate) => {
  if (!queryName?.trim()) return null;
  const qTokens = tokenize(queryName);
  if (qTokens.length === 0) return null;

  const queryYear = queryDate?.match(/^(\d{4})/)?.[1];

  let best = null;
  for (const meet of SWIM_MEETS) {
    // If the meet is pinned to a specific year, demand it matches the query
    // (when the user provided a date). This stops "Senior Nationals 2024"
    // from matching the 2019 Bhopal edition.
    if (meet.year && queryYear && String(meet.year) !== queryYear) continue;

    const candidates = [meet.name, ...(meet.aliases || [])];
    for (const cand of candidates) {
      const cTokens = tokenize(cand);
      const score = overlapScore(qTokens, cTokens);
      if (!best || score > best.score) {
        best = { match: meet, score, matchedOn: cand };
      }
    }
  }

  // Threshold: 0.6 = at least 60% of the smaller token set overlaps.
  // Empirically this catches abbreviations ("KIYG") and missing words
  // ("Senior Nationals") without matching random strings.
  if (!best || best.score < 0.6) return null;
  return best;
};

/**
 * Convenience wrapper used by the Profile / migration code.
 * @returns true if the meet name (and optional date) is in our DB.
 */
export const isMeetVerified = (name, date) => Boolean(findMeetMatch(name, date));
