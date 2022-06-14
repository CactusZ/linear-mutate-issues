import { info } from '@actions/core';
import assert from 'assert';
import { LinearAPIClient } from './linear';
import { getActionParameters } from './parameters';

export async function moveIssues(
  p: ReturnType<typeof getActionParameters>
): Promise<number> {
  const client = new LinearAPIClient(p.linear_token);

  if (
    p.team_identifier &&
    p.allowed_team_identifiers.indexOf(p.team_identifier) === -1
  ) {
    info(`Team ${p.team_identifier} is not allowed to move issues`);
    return 0;
  }

  const teams = p.team_identifier
    ? await client.getTeamByKey([p.team_identifier])
    : await client.getTeamByKey(p.allowed_team_identifiers);

  if (p.team_identifier) {
    assert(teams[0], `team with name ${p.team_identifier} not found`);
  } else {
    assert(
      teams.length !== p.allowed_team_identifiers.length,
      'no teams found'
    );
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
        newState
      }
    );
    issuesMovedTotal += issuesMovedCount;
  }

  return issuesMovedTotal;
}
