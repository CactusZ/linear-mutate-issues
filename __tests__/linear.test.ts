import { LinearAPIClient } from '../src/linear';

const issueMock = jest.fn();
jest.mock('@linear/sdk', () => ({
  LinearClient: jest.fn(() => ({
    issue: issueMock
  }))
}));
// shows how the runner will run a javascript action with env / stdout protocol
test('getIssueById()', async () => {
  const client = new LinearAPIClient('testApiKey');
  client.getIssueById('test');
  expect(issueMock).toBeCalledWith('test');
});
