import * as core from '@actions/core'
import {moveIssues} from './linear'

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('LINEAR_TOKEN')
    const stateFrom = core.getInput('state_from')
    const stateTo = core.getInput('state_to')

    await moveIssues(stateFrom, stateTo, apiKey)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
