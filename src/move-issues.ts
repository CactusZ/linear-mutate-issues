import { info } from '@actions/core';
import assert from 'assert';
import { LinearAPIClient } from './linear';
import { Parameters } from './parameters';

export async function moveIssues(p: Parameters): Promise<number> {
  const client = new LinearAPIClient(p.linear_token);

  const team = p.team_name
    ? await client.getTeamByName(p.team_name)
    : undefined;

  if (p.team_name) {
    assert(team, `team with name ${p.team_name} not found`);
  }

  info('Retrieving Statuses from API');
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
  return issuesMovedCount;
}
