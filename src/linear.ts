import { info, error } from '@actions/core';
import {
  Issue,
  LinearClient,
  LinearError,
  Team,
  WorkflowState
} from '@linear/sdk';
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

  async getAllStates({ team }: { team: Team }) {
    const allStates = (await team.states()).nodes;

    return allStates;
  }

  async getTeamByKey(key: string[]) {
    info('Retrieving Team from API');
    const teams = (await this.client.teams()).nodes;
    const teamsFiltered = teams.filter(t => key.includes(t.key));
    return teamsFiltered;
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

  private addTeamToFilter(filter: IssueFilter, team: Team) {
    filter.team = { id: { eq: team.id } };
  }

  async getIssues(filter: IssueFilter) {
    const response = await this.client.issues({ filter });
    return response.nodes;
  }

  async moveIssuesToNewState(
    issueFilter: {
      state?: WorkflowState;
      issueId?: number;
      team?: Team;
    },
    issueMutation: {
      newState?: WorkflowState;
      includeChildren?: boolean;
    }
  ) {
    const filter: IssueFilter = {};
    if (issueFilter.state) {
      this.addStateToIssueFilter(filter, issueFilter.state);
    }
    if (issueFilter.issueId) {
      this.addIssueIdToFilter(filter, issueFilter.issueId);
    }
    if (issueFilter.team) {
      this.addTeamToFilter(filter, issueFilter.team);
    }
    const issues = await this.getIssues(filter);
    const issueCount = issues.length;
    if (issueCount) {
      info(`Found ${issueCount} issues to move`);
      for (const issue of issues) {
        info(`updating issue ${issue.identifier}`);
        if (issueMutation.newState) {
          try {
            await this.moveIssueToNewState(
              issue,
              issueMutation.newState,
              !!issueMutation.includeChildren
            );
          } catch (e) {
            error(e as Error);
            if (e instanceof LinearError) {
              error(`Failed HTTP status:${e.status}`);
              error(`Failed response data:${e.data}`);
              error(`Failed query: ${e.query}`);
              error(`Error type: ${e.type}`);
              error(`Failed errors: ${e.errors}`);
              error(`Original: ${e.raw}`);
            }
            throw new Error(
              `Error while moving issue ${issue.identifier}. Error=${e}`
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

  private async moveIssueToNewState(
    issue: Issue,
    state: WorkflowState,
    includeChildren: boolean
  ) {
    if (includeChildren) {
      const subIssues = (await issue.children()).nodes || [];
      for (const subIssue of subIssues) {
        info(
          `Moving sub-issue ${subIssue.identifier} of issue ${issue.identifier}`
        );
        await this.moveIssueToNewState(subIssue, state, includeChildren);
      }
    }
    return this.client.issueUpdate(issue.id, { stateId: state.id });
  }
}
