import * as rp from 'request-promise';
import * as xml2js from 'xml2js';

export class SqlQuery {

  private options: any;

  constructor(public instance_crn: string, private token: string, public endpoint = 'https://sql-api.ng.bluemix.net/v2') {
    if (!instance_crn) {
      throw new Error(`SQL Query instance CRN is not defined`);
    }

    if (!token) {
      throw new Error(`IAM Token is not defined`);
    }

    const url = `${endpoint}/sql_jobs?instance_crn=${instance_crn}`;

    // options (mostly) common to all the APIs
    this.options = {
      url,
      headers: {
        accept: 'application/json',
        'User-Agent': 'openwhisk-sql-query'
      },
      auth: {
        bearer: token
      },
      json: true,
    };
  }

  async getCosKey(endpoint: string, auth: any, bucket: string, prefix: string) {
    const response = await rp({
      url: `https://${endpoint}/${bucket}?prefix=${encodeURIComponent(prefix)}`,
      auth,
    });

    return new Promise((resolve, reject) => {
      xml2js.parseString(response, (err, result) => err ? reject(err) : resolve(result));
    });
  }

  runSqlJob(statement: string, resultset_target: string) {
    console.log(`Running SQL Query job ${statement} with resultset ${resultset_target}`);

    if (!statement || !resultset_target) {
      throw new Error(`Missing args found in SQL Query job`);
    }

    return rp({
      ...this.options,
      ...{
        method: 'POST',
        body: {
          statement,
          resultset_target
        }
      }
    });
  }

  async getSqlJob(jobId: string) {
    const response = await rp({
      ...this.options,
      ... {
        url: `${this.endpoint}/sql_jobs/${jobId}?instance_crn=${this.instance_crn}`
      }
    });

    const [endpoint, bucket, ...rest] = response.resultset_location.substring(6).split('/');
    let key = rest.join('/');

    const cos: any = await this.getCosKey(endpoint, this.options.auth, bucket, `${key}/part`);
    key = cos.ListBucketResult.Contents[0].Key[0];

    return { ...response, endpoint, bucket, key };
  }

  async getSqlJobs() {
    return rp(this.options);
  }
}

export interface SqlQueryParams {
  endpoint?: string;
  token?: string;
  apiKey?: string;
  instance_crn: string;
  statement?: string;
  resultset_target?: string;
  job_id?: string;
}

export default async function main(params: SqlQueryParams): Promise<any> {
  const {
    endpoint = 'https://sql-api.ng.bluemix.net/v2',
    instance_crn,
    apiKey,
    statement,
    resultset_target,
    job_id
  } = params;
  
  let { token } = params;

  // apiKey provided - get IAM token
  if (apiKey) {
    const response = await rp({
      url: 'https://iam.bluemix.net/identity/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: "POST",
      body: `apikey=${apiKey}&grant_type=urn%3Aibm%3Aparams%3Aoauth%3Agrant-type%3Aapikey`,
      json: true
    });

    token = response.access_token;
  }

  const sqlQuery = new SqlQuery(instance_crn, token, endpoint);

  // user provided a statement - intent is to run SQL Query job
  if (statement) {
    return sqlQuery.runSqlJob(statement, resultset_target);
  }

  // user provided a job ID - intent is to get a SQL Query job
  if (job_id) {
    return sqlQuery.getSqlJob(job_id);
  }

  // assume the intent is the list of recent jobs
  return sqlQuery.getSqlJobs();

}