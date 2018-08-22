import * as rp from 'request-promise';

export interface SqlQueryParams {
  endpoint?: string;
  token: string;
  instance_crn: string;
  statement?: string;
  resultset_target?: string;
  job_id?: string;
}

export class WebResponse {
  headers = { 'Content-Type': 'text/html' };

  constructor(public body: string, public statusCode = 200) {

  }
}

function runSqlJob(options: any, statement: string, resultset_target: string) {
  console.log(`Running SQL Query job ${statement} with resultset ${resultset_target}`);

  if (!statement || !resultset_target) {
    throw new Error(`Missing args found in SQL Query job`);
  }
  options.method = 'POST',
  options.body = {
    statement,
    resultset_target
  };

  return rp(options);
}

export default function main(params: SqlQueryParams): Promise<any> {
  const {
    endpoint = 'https://sql-api.ng.bluemix.net/v2',
    instance_crn,
    token,
    statement,
    resultset_target,
    job_id
  } = params;

  const url = `${endpoint}/sql_jobs?instance_crn=${instance_crn}`

  if (!instance_crn) {
    throw new Error(`SQL Query instance CRN is not defined in arg 'instance_crn'`);
  }

  if (!token) {
    throw new Error(`IAM Token not defined in arg 'bearer'`);
  }

  // options common to all APIs
  const options = {
    url,
    headers: {
      accept: 'application/json'
    },
    auth: {
      bearer: token
    },
    json: true,
  };

  // user provided a statement - intent is to run SQL Query job
  if (statement) {
    return runSqlJob(options, statement, resultset_target);
  }

  // user provided a job ID - intent is to get a SQL Query job
  if (job_id) {
    options.url = `${endpoint}/sql_jobs/${job_id}?instance_crn=${instance_crn}`;
    return rp(options);
  }

  // assume the intent is the list of recent jobs
  return rp(options)

}