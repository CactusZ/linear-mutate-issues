import { info } from '@actions/core';
import assert from 'assert';
import { LinearAPIClient } from './linear';
import { Parameters } from './parameters';

export async function moveIssues(p: Parameters): Promise<number> {
  const client = new LinearAPIClient(p.linear_token);
  info('Retrieving Statuses from API');
  const allStates = await client.getAllStates();
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
      issueId: Number(p.issue_number)
    },
    {
      newState
    }
  );
  return issuesMovedCount;
}
