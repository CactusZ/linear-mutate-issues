import { setFailed, notice } from '@actions/core';
import { moveIssues } from './move-issues';
import { getActionParameters } from './parameters';

async function run(): Promise<void> {
  try {
    const parameters = getActionParameters();
    const movedIssuesCount = await moveIssues(parameters);

    notice(`${movedIssuesCount} issues have been moved!`);
  } catch (error) {
    if (error instanceof Error) setFailed(error.message);
  }
}

run();
