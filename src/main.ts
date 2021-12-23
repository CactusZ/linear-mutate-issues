import { getInput, setFailed, notice } from '@actions/core';
import { moveIssues } from './move-issues';

async function run(): Promise<void> {
  try {
    const apiKey = getInput('LINEAR_TOKEN');
    const stateFrom = getInput('state_from');
    const stateTo = getInput('state_to');

    const movedIssuesCount = await moveIssues(stateFrom, stateTo, apiKey);

    notice(`${movedIssuesCount} issues have been moved!`);
  } catch (error) {
    if (error instanceof Error) setFailed(error.message);
  }
}

run();
