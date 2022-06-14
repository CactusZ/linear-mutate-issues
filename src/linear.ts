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

  async getAllStates({ team }: { team?: Team }) {
    const allStates = (await this.client.workflowStates()).nodes;

    const teams = team
      ? await Promise.all(allStates.map(state => state.team))
      : [];

    return allStates.filter((state, index) => {
      if (team) {
        const stateTeam = teams[index];
        return stateTeam?.id === team.id;
      } else {
        return true;
      }
    });
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
        info(`updating issue ${issue.number}`);
        if (issueMutation.newState) {
          try {
            await this.moveIssueToNewState(issue, issueMutation.newState);
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
