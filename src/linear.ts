import {LinearClient} from '@linear/sdk'

import {debug} from '@actions/core'

export async function moveIssues(
  previousStateName: string,
  newStateName: string,
  apiKey: string
): Promise<void> {
  if (!apiKey) {
    throw new Error('LINEAR API KEY not defined')
  }

  if (!previousStateName) {
    throw new Error('previous state name not defined')
  }

  if (!newStateName) {
    throw new Error('new state name not defined')
  }

  const client = new LinearClient({apiKey})
  const allStates = (await client.workflowStates()).nodes
  const beforeState = allStates.find(state => state.name === previousStateName)
  const afterState = allStates.find(state => state.name === newStateName)
  if (!beforeState) {
    throw new Error(
      `previous state with name ${previousStateName} not found. Found states ${allStates.map(
        s => s.name
      )}`
    )
  }
  if (!afterState) {
    throw new Error(
      `new state with name ${newStateName} not found. Found states ${allStates.map(
        s => s.name
      )}`
    )
  }
  const issueFilter = {state: {id: {eq: beforeState.id}}}

  debug('fetching issues from Linear API')
  const issues = (
    await client.issues({
      filter: issueFilter
    })
  ).nodes

  const issueCount = issues.length

  if (issueCount) {
    debug(`Found ${issueCount} issues to move`)
    for (const issue of issues) {
      debug(`updating issue ${issue.id}`)
      await client.issueUpdate(issue.id, {stateId: afterState.id})
    }
  } else {
    debug(`No issues found with filter ${issueFilter}`)
  }
}
