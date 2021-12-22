import { debug } from '@actions/core';
import assert from 'assert';
import { LinearAPIClient } from './linear';

export async function moveIssues(
  previousStateName: string,
  newStateName: string,
  apiKey: string
): Promise<void> {
  if (!apiKey) {
    throw new Error('LINEAR API KEY not defined');
  }

  if (!previousStateName) {
    throw new Error('previous state name not defined');
  }

  if (!newStateName) {
    throw new Error('new state name not defined');
  }
  const client = new LinearAPIClient(apiKey);
  const allStates = await client.getAllStates();
  const stateNames = allStates.map(s => s.name);
  const beforeState = allStates.find(state => state.name === previousStateName);
  const afterState = allStates.find(state => state.name === newStateName);
  assert(
    beforeState,
    `previous state with name ${previousStateName} not found. Found states ${stateNames}`
  );
  assert(
    afterState,
    `new state with name ${newStateName} not found. Found states ${stateNames}`
  );
  client.addStateToIssueFilter(beforeState);

  debug('fetching issues from Linear API');
  await client.moveFilteredIssuesToNewState(afterState);
}
