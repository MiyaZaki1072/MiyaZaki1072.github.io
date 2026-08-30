// Fetches the GitHub contribution calendar and writes data/contributions.json
// for the static page to read.
//
// This runs in Actions, never in the browser. The contributions calendar is
// exposed only through the GraphQL API, GraphQL requires a token, and this repo
// is served publicly - so a client-side fetch would mean shipping a credential
// on the page. Building the data in CI is the only way to have it at all.

import { mkdir, writeFile } from 'node:fs/promises';

const login = process.env.GH_LOGIN;
const token = process.env.GH_TOKEN;

if (!login || !token) {
    console.error('GH_LOGIN and GH_TOKEN must both be set.');
    process.exit(1);
}

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { contributionCount contributionLevel weekday }
          }
        }
      }
    }
  }`;

// GitHub's own bucketing, reused rather than re-derived from raw counts so the
// ramp on the page matches the one on the profile.
const LEVELS = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
        authorization: `bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': `${login}-portfolio-build`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
});

if (!response.ok) {
    console.error(`GitHub API returned ${response.status} ${response.statusText}`);
    console.error(await response.text());
    process.exit(1);
}

const payload = await response.json();

// GraphQL reports failures inside a 200 body, so the status code alone is not
// enough to know the query worked.
if (payload.errors) {
    console.error('GraphQL errors:', JSON.stringify(payload.errors, null, 2));
    process.exit(1);
}

const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) {
    console.error(`No calendar returned for "${login}".`);
    console.error('If the token is GITHUB_TOKEN, it may not be authorised for this');
    console.error('field. Create a classic PAT with read:user and store it as CONTRIB_TOKEN.');
    process.exit(1);
}

const rawWeeks = calendar.weeks.map(week => week.contributionDays);
const days = rawWeeks.flat();

if (!days.length) {
    console.error('Calendar came back empty.');
    process.exit(1);
}

// Streaks are counted over real days, before any padding is added.
const counts = days.map(day => day.contributionCount);

let longest = 0;
let run = 0;
for (const count of counts) {
    run = count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
}

// Today can legitimately still be on zero, so an empty final day does not end
// the streak - it simply has not been counted yet.
let current = 0;
for (let i = counts.length - 1; i >= 0; i--) {
    if (counts[i] > 0) current++;
    else if (i !== counts.length - 1) break;
}

const byWeekday = new Array(7).fill(0);
for (const day of days) byWeekday[day.weekday] += day.contributionCount;
const busiest = byWeekday.indexOf(Math.max(...byWeekday));

// The first and last weeks are partial whenever the range starts or ends
// mid-week. Placing each day at its own weekday index pads both ends with null,
// which keeps every column seven cells tall so the rows line up.
const weeks = rawWeeks.map(week => {
    const column = new Array(7).fill(null);
    for (const day of week) column[day.weekday] = LEVELS[day.contributionLevel] ?? 0;
    return column;
});

const output = {
    generated: new Date().toISOString().slice(0, 10),
    total: calendar.totalContributions,
    streak: { current, longest },
    busiestWeekday: DAY_NAMES[busiest],
    weeks,
};

await mkdir('data', { recursive: true });
await writeFile('data/contributions.json', JSON.stringify(output));

console.log(
    `Wrote ${weeks.length} weeks: ${output.total} contributions, ` +
    `current streak ${current}, longest ${longest}, busiest ${output.busiestWeekday}.`
);
