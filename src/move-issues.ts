import { info } from '@actions/core';
import assert from 'assert';
import { LinearAPIClient } from './linear';
import { getActionParameters } from './parameters';

export async function moveIssues(
  p: ReturnType<typeof getActionParameters>
): Promise<number> {
  const client = new LinearAPIClient(p.linear_token);

  const teams = await client.getTeamByKey(p.team_identifier);

  if (p.team_identifier && p.team_identifier.length > 1) {
    assert(
      teams.length === p.team_identifier.length,
      `not all teams found. Found teams: ${teams
        .map(t => t.key)
        .join(', ')} but expected: ${p.team_identifier.join(', ')}`
    );
  } else if (
    p.team_identifier &&
    p.team_identifier.length === 1 &&
    !teams.length
  ) {
    info(`Team ${p.team_identifier} not found`);
    return 0;
  }

  info('Retrieving Statuses from API');
  let issuesMovedTotal = 0;
  for (const team of teams) {
    const allStates = await client.getAllStates({ team });
    const stateNames = allStates.map(s => s.name);
    const beforeState = allStates.find(state => state.name === p.status_from);
    const newState = allStates.find(state => state.name === p.status_to);
    if (p.status_from) {
      assert(
        beforeState,
        `previous state with name ${p.status_from} not found. Found states ${stateNames}`
      );
    }

    if (p.status_to) {
      assert(
        newState,
        `new state with name ${p.status_to} not found. Found states ${stateNames}`
      );
    }
    info('Moving issues');
    const issuesMovedCount = await client.moveIssuesToNewState(
      {
        state: beforeState,
        issueId: Number(p.issue_number),
        team
      },
      {
        newState,
        includeChildren: true
      }
    );
    issuesMovedTotal += issuesMovedCount;
  }

  return issuesMovedTotal;
}
