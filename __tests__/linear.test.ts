import { Issue, WorkflowState } from '@linear/sdk';
import { LinearAPIClient } from '../src/linear';

const states = [
  { id: '1', name: 'state One' },
  { id: '2', name: 'state Two' }
] as WorkflowState[];

const issues = [
  {
    id: 'PROJECT-82'
  },
  {
    id: 'PROJECT-83'
  }
] as Issue[];

const issueMock = jest.fn();
const workflowStatesMock = jest.fn().mockResolvedValue({ nodes: states });
const issuesMethodMock = jest.fn().mockResolvedValue({ nodes: issues });
const issueUpdateMock = jest.fn();

jest.mock('@linear/sdk', () => ({
  LinearClient: jest.fn(() => ({
    issue: issueMock,
    workflowStates: workflowStatesMock,
    issues: issuesMethodMock,
    issueUpdate: issueUpdateMock
  }))
}));

describe('LinearAPIClient class', () => {
  let client: LinearAPIClient;
  beforeEach(() => {
    client = new LinearAPIClient('testApiKey');
  });

  it('getIssueById()', async () => {
    client.getIssueById('test');
    expect(issueMock).toBeCalledWith('test');
  });

  it('getAllStates()', async () => {
    const fetchedStates = await client.getAllStates();
    expect(fetchedStates).toEqual(states);
  });

  it('moveIssuesToNewState()', async () => {
    await client.moveIssuesToNewState(
      {
        state: states[0],
        issueId: 'test'
      },
      {
        newState: states[1]
      }
    );
    expect(issuesMethodMock).toBeCalledWith({
      filter: {
        state: {
          id: {
            eq: states[0].id
          }
        },
        id: {
          eq: 'test'
        }
      }
    });
    expect(issueUpdateMock).toHaveBeenNthCalledWith(1, 'PROJECT-82', {
      stateId: '2'
    });
    expect(issueUpdateMock).toHaveBeenNthCalledWith(2, 'PROJECT-83', {
      stateId: '2'
    });
  });
  it('moveIssuesToNewState()', async () => {
    issuesMethodMock.mockResolvedValueOnce({ nodes: [] });
    await client.moveIssuesToNewState(
      {
        state: states[0],
        issueId: 'test'
      },
      {
        newState: states[1]
      }
    );
    expect(issuesMethodMock).toBeCalledWith({
      filter: {
        state: {
          id: {
            eq: states[0].id
          }
        },
        id: {
          eq: 'test'
        }
      }
    });
    expect(issueUpdateMock).not.toBeCalled();
  });
});
