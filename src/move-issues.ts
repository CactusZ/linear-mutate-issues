import assert from 'assert';
import { LinearAPIClient } from './linear';
import { Parameters } from './parameters';

export async function moveIssues(p: Parameters): Promise<number> {
  const client = new LinearAPIClient(p.linear_token);
  const allStates = await client.getAllStates();
  const stateNames = allStates.map(s => s.name);
  const beforeState = allStates.find(state => state.name === p.state_from);
  const newState = allStates.find(state => state.name === p.state_to);
  if (p.state_from) {
    assert(
      beforeState,
      `previous state with name ${p.state_from} not found. Found states ${stateNames}`
    );
  }

  if (p.state_to) {
    assert(
      newState,
      `new state with name ${p.state_to} not found. Found states ${stateNames}`
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
