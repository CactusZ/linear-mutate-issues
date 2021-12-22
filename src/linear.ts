import { debug } from '@actions/core';
import { Issue, LinearClient, WorkflowState } from '@linear/sdk';
import assert from 'assert';

type IssuesFuncParams = Exclude<
  Parameters<LinearClient['issues']>[0],
  undefined
>;
export class LinearAPIClient {
  private client: LinearClient;
  private filter: NonNullable<IssuesFuncParams['filter']> = {};
  constructor(apiKey: string) {
    assert(apiKey);

    this.client = new LinearClient({ apiKey });
  }

  async getAllStates() {
    const allStates = (await this.client.workflowStates()).nodes;
    return allStates;
  }

  async getIssueById(issueId: string) {
    const issue = await this.client.issue(issueId);
    return issue;
  }

  addStateToIssueFilter(state: WorkflowState) {
    this.filter.state ??= {};
    this.filter.state.id = { eq: state.id };
  }

  addIssueToFilter(issue: Issue) {
    this.filter.id = { eq: issue.id };
  }

  async getIssuesWithCurrentFilter() {
    const response = await this.client.issues({ filter: this.filter });
    return response.nodes;
  }

  async moveFilteredIssuesToNewState(state: WorkflowState) {
    const issues = await this.getIssuesWithCurrentFilter();
    const issueCount = issues.length;
    if (issueCount) {
      debug(`Found ${issueCount} issues to move`);
      for (const issue of issues) {
        debug(`updating issue ${issue.id}`);
        await this.moveIssueToNewState(issue, state);
      }
    } else {
      debug(`No issues found with filter ${JSON.stringify(this.filter)}`);
    }
  }

  async moveIssueToNewState(issue: Issue, state: WorkflowState) {
    await this.client.issueUpdate(issue.id, { stateId: state.id });
  }
}
