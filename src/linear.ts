import { debug } from '@actions/core';
import { Issue, LinearClient, WorkflowState } from '@linear/sdk';
import assert from 'assert';

type IssuesFuncParams = Exclude<
  Parameters<LinearClient['issues']>[0],
  undefined
>;
type IssueFilter = NonNullable<IssuesFuncParams['filter']>;
export class LinearAPIClient {
  private client: LinearClient;
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

  private addStateToIssueFilter(filter: IssueFilter, state: WorkflowState) {
    filter.state ??= {};
    filter.state.id = { eq: state.id };
  }

  private addIssueIdToFilter(filter: IssueFilter, issueId: string) {
    filter.id = { eq: issueId };
  }

  async getIssues(filter: IssueFilter) {
    const response = await this.client.issues({ filter });
    return response.nodes;
  }

  async moveIssuesToNewState(
    issueFilter: {
      state?: WorkflowState;
      issueId?: string;
    },
    newState: WorkflowState
  ) {
    const filter: IssueFilter = {};
    if (issueFilter.state) {
      this.addStateToIssueFilter(filter, issueFilter.state);
    }
    if (issueFilter.issueId) {
      this.addIssueIdToFilter(filter, issueFilter.issueId);
    }
    const issues = await this.getIssues(filter);
    const issueCount = issues.length;
    if (issueCount) {
      debug(`Found ${issueCount} issues to move`);
      for (const issue of issues) {
        debug(`updating issue ${issue.id}`);
        await this.moveIssueToNewState(issue, newState);
      }
    } else {
      debug(`No issues found with filter ${JSON.stringify(filter)}`);
    }

    return issueCount;
  }

  private async moveIssueToNewState(issue: Issue, state: WorkflowState) {
    await this.client.issueUpdate(issue.id, { stateId: state.id });
  }
}
