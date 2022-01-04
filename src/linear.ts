import { info, error } from '@actions/core';
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

  private addIssueIdToFilter(filter: IssueFilter, issueId: number) {
    filter.number = { eq: issueId };
  }

  async getIssues(filter: IssueFilter) {
    const response = await this.client.issues({ filter });
    return response.nodes;
  }

  async moveIssuesToNewState(
    issueFilter: {
      state?: WorkflowState;
      issueId?: number;
    },
    issueMutation: {
      newState?: WorkflowState;
    }
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
      info(`Found ${issueCount} issues to move`);
      for (const issue of issues) {
        info(`updating issue ${issue.id}`);
        if (issueMutation.newState) {
          try {
            await this.moveIssueToNewState(issue, issueMutation.newState);
          } catch (e) {
            error(e as Error);
            throw new Error(
              `Error while moving issue ${issue.number}. Error=${e}`
            );
          }
        } else {
          throw new Error('No mutation defined');
        }
      }
    } else {
      info(`No issues found with filter ${JSON.stringify(filter)}`);
    }

    return issueCount;
  }

  private async moveIssueToNewState(issue: Issue, state: WorkflowState) {
    return this.client.issueUpdate(issue.id, { stateId: state.id });
  }
}
