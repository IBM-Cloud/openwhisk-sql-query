export declare class SqlQuery {
    instance_crn: string;
    private token;
    endpoint: string;
    private options;
    constructor(instance_crn: string, token: string, endpoint?: string);
    getCosKey(endpoint: string, auth: any, bucket: string, prefix: string): Promise<{}>;
    runSqlJob(statement: string, resultset_target: string): any;
    getSqlJob(jobId: string): Promise<any>;
    getSqlJobs(): Promise<any>;
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
export default function main(params: SqlQueryParams): Promise<any>;
