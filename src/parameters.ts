import { getInput } from '@actions/core';

const requiredParameters = ['linear_token'] as const;
type RequiredParameters = {
  // eslint-disable-next-line no-unused-vars
  [key in typeof requiredParameters[number]]: string;
};

const filterParameters = ['status_from', 'issue_id'] as const;

type IssueFilterParameters = {
  // eslint-disable-next-line no-unused-vars
  [key in typeof filterParameters[number]]: string;
};

const mutationParameters = ['status_to'] as const;
type IssueMutationParameters = {
  // eslint-disable-next-line no-unused-vars
  [key in typeof mutationParameters[number]]: string;
};

export type Parameters = RequiredParameters &
  IssueFilterParameters &
  IssueMutationParameters;

const actionParameters: Array<keyof Parameters> = [
  ...requiredParameters,
  ...filterParameters,
  ...mutationParameters
];
function validateParameters(p: Parameters) {
  if (!p.linear_token) {
    throw new Error('LINEAR API KEY not defined');
  }

  if (!filterParameters.some(parameter => p[parameter])) {
    throw new Error(
      `At least one issue filtering param should be defined. Possible options are: ${filterParameters.join(
        ', '
      )}`
    );
  }

  if (!mutationParameters.some(parameter => p[parameter])) {
    throw new Error(
      `At least one issue mutation param should be defined. Possible options are: ${mutationParameters.join(
        ', '
      )}`
    );
  }
}

export function getActionParameters() {
  const result = actionParameters.reduce<Parameters>((res, cur) => {
    res[cur] = getInput(cur);
    return res;
  }, {} as Parameters);
  validateParameters(result);
  return result;
}
