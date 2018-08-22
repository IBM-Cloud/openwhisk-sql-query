import SqlQuery , { SqlQueryParams } from '../src/SqlQuery';

import * as dotenv from 'dotenv';
import { expect } from 'chai';

dotenv.config();

const {
  BEARER: token,
  INSTANCE_CRN: instance_crn,
  RESULTSET_TARGET: resultset_target,
} = process.env;

const statement = `SELECT e1.firstname employee, e2.firstname colleague, e1.city
FROM cos://us-geo/sql/employees.parquet STORED AS PARQUET e1,
     cos://us-geo/sql/employees.parquet STORED AS PARQUET e2
WHERE e2.city = e1.city
      AND e1.employeeid <> e2.employeeid
      AND e1.firstname = 'Steven'
ORDER BY e1.city , e1.firstname`;

describe('sql-query', function () {
  this.timeout(30000);
  
  let job_id = '';

  it ('runSqlJob', async () => {
    const response = await SqlQuery({
      token,
      instance_crn,
      statement,
      resultset_target
    } as SqlQueryParams);

    console.log(JSON.stringify(response));

    expect(response).to.not.be.undefined;
    expect(response.job_id).to.not.be.undefined;

    ({ job_id } = response);
  });

  it ('recentJobs', async () => {
    const response = await SqlQuery({
      token,
      instance_crn
    } as SqlQueryParams);

    console.log(JSON.stringify(response));

    expect(response.jobs.length).to.be.greaterThan(0);
  });

  it ('job', (done) => {
    return setTimeout(async () => {
      const response = await SqlQuery({
        token,
        instance_crn,
        job_id
      } as SqlQueryParams);

      console.log(JSON.stringify(response));

      expect(response).to.not.be.undefined;
      expect(response.job_id).to.equal(job_id);
      expect(response.key).to.not.be.undefined;

      done();
    }, 10000);
  });

});