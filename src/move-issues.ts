import assert from 'assert';
import { LinearAPIClient } from './linear';
import { Parameters } from './parameters';

export async function moveIssues(p: Parameters): Promise<number> {
  const client = new LinearAPIClient(p.linear_token);
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

  const issuesMovedCount = client.moveIssuesToNewState(
    {
      state: beforeState,
      issueId: p.issue_id
    },
    {
      newState
    }
  );
  return issuesMovedCount;
}
