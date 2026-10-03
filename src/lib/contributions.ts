// Shared by the Cloudflare Pages Function (production) and the dev server

export interface ContributionDay {
  date: string;
  count: number;
}

export interface Contributions {
  total: number;
  weeks: ContributionDay[][];
}

const QUERY = `
  query {
    viewer {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount }
          }
        }
      }
    }
  }
`;

export async function fetchContributions(token: string): Promise<Contributions> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'personal-site',
    },
    body: JSON.stringify({ query: QUERY }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded ${response.status}`);
  }

  const json: any = await response.json();
  const calendar = json?.data?.viewer?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    throw new Error(json?.errors?.[0]?.message ?? 'No contribution data returned');
  }

  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week: any) =>
      week.contributionDays.map((day: any) => ({ date: day.date, count: day.contributionCount })),
    ),
  };
}
